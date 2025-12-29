const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Tạo thư mục uploads nếu chưa có
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Tạo tên file unique: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// Filter chỉ cho phép hình ảnh
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload hình ảnh (jpeg, jpg, png, gif, webp)'), false);
  }
};

// Cấu hình multer cho upload thông thường
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  }
});

// Cấu hình multer riêng cho avatar (giới hạn nhỏ hơn)
const avatarUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB - avatar đã được resize ở frontend
  }
});

// @route   POST /api/upload/avatar
// @desc    Upload avatar cho user
// @access  User (đã đăng nhập)
router.post('/avatar', protect, avatarUpload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn hình ảnh để upload'
      });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Upload avatar thành công',
      url: imageUrl,
      data: {
        url: imageUrl,
        filename: req.file.filename
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi upload avatar',
      error: error.message
    });
  }
});

// @route   POST /api/upload/payment-proof
// @desc    Upload payment proof screenshot (for bank transfer/momo)
// @access  Public (guest can upload)
router.post('/payment-proof', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ảnh chụp màn hình thanh toán'
      });
    }

    const { orderId, orderCode } = req.body;

    if (!orderId && !orderCode) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã đơn hàng'
      });
    }

    const Order = require('../models/Order');

    // Find order by ID or order code
    let order;
    if (orderId) {
      order = await Order.findById(orderId);
    } else if (orderCode) {
      order = await Order.findOne({ orderCode: orderCode });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Only allow payment proof for bank_transfer or momo
    if (!['bank_transfer', 'momo'].includes(order.paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng này không yêu cầu xác nhận thanh toán'
      });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    // Update order with payment proof
    order.paymentProof = {
      image: imageUrl,
      uploadedAt: new Date(),
    };
    await order.save();

    res.json({
      success: true,
      message: 'Upload thành công! Shop sẽ xác nhận thanh toán trong ít phút.',
      data: {
        url: imageUrl,
        orderId: order._id,
        orderCode: order.orderCode
      }
    });
  } catch (error) {
    console.error('Payment proof upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi upload ảnh xác nhận thanh toán',
      error: error.message
    });
  }
});

// @route   POST /api/upload
// @desc    Upload 1 hình ảnh
// @access  Admin
router.post('/', protect, admin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn hình ảnh để upload'
      });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Upload thành công',
      data: {
        url: imageUrl,
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi upload hình ảnh',
      error: error.message
    });
  }
});

// @route   POST /api/upload/multiple
// @desc    Upload nhiều hình ảnh (tối đa 10)
// @access  Admin
router.post('/multiple', protect, admin, upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn hình ảnh để upload'
      });
    }

    const images = req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      originalname: file.originalname,
      size: file.size
    }));

    res.json({
      success: true,
      message: `Upload thành công ${images.length} hình ảnh`,
      data: images
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi upload hình ảnh',
      error: error.message
    });
  }
});

// @route   DELETE /api/upload/:filename
// @desc    Xóa hình ảnh
// @access  Admin
router.delete('/:filename', protect, admin, (req, res) => {
  try {
    const filepath = path.join(uploadDir, req.params.filename);

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      res.json({
        success: true,
        message: 'Xóa hình ảnh thành công'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy hình ảnh'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa hình ảnh',
      error: error.message
    });
  }
});

// Error handler cho multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Kích thước file vượt quá 5MB'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ được upload tối đa 10 hình'
      });
    }
  }

  res.status(400).json({
    success: false,
    message: err.message || 'Lỗi khi upload'
  });
});

module.exports = router;
