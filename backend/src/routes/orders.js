const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { protect, admin } = require('../middleware/auth');
const { webhookLimiter } = require('../middleware/rateLimit');
const {
  notifyOrderCreated,
  notifyOrderStatusChange,
  notifyPaymentStatusChange,
} = require('../utils/notifications');

const router = express.Router();

// Helper to validate MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// @route   POST /api/orders/guest
// @desc    Create a guest order (no login required)
// @access  Public
router.post(
  '/guest',
  [
    body('items').isArray({ min: 1 }).withMessage('Vui lòng chọn ít nhất một sản phẩm'),
    body('shippingAddress').notEmpty().withMessage('Vui lòng nhập địa chỉ giao hàng'),
    body('shippingAddress.fullName').notEmpty().withMessage('Vui lòng nhập họ tên'),
    body('shippingAddress.phone').notEmpty().withMessage('Vui lòng nhập số điện thoại'),
    body('shippingAddress.address').notEmpty().withMessage('Vui lòng nhập địa chỉ'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: errors.array()[0].msg,
        });
      }

      const {
        items,
        shippingAddress,
        paymentMethod,
        deliveryDate,
        deliveryTime,
        giftMessage,
        note,
        couponCode,
      } = req.body;

      // Validate items and calculate totals
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(400).json({
            success: false,
            message: `Sản phẩm không tồn tại: ${item.product}`,
          });
        }

        if (product.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Sản phẩm "${product.name}" không đủ hàng`,
          });
        }

        orderItems.push({
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          image: product.images[0],
        });

        subtotal += product.price * item.quantity;

        // Reduce stock
        product.stock -= item.quantity;
        await product.save();
      }

      // Calculate shipping (Vietnamese format: free over 750000đ, else 30000đ)
      const shippingCost = subtotal >= 750000 ? 0 : 30000;
      const tax = 0;
      let discount = 0;
      let appliedCoupon = null;

      // Validate and apply coupon if provided
      if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
        if (coupon) {
          const validation = coupon.validateForOrder(
            subtotal,
            null, // No user for guest
            shippingAddress.phone,
            orderItems.map(item => ({ product: item.product }))
          );

          if (validation.isValid) {
            discount = coupon.calculateDiscount(subtotal);
            appliedCoupon = coupon;
          }
        }
      }

      const total = subtotal + shippingCost - discount;

      const order = await Order.create({
        isGuest: true,
        user: null,
        items: orderItems,
        shippingAddress,
        paymentMethod: paymentMethod || 'cod',
        subtotal,
        shippingCost,
        tax,
        discount,
        total,
        deliveryDate,
        deliveryTime,
        giftMessage,
        note,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
      });

      // Record coupon usage
      if (appliedCoupon) {
        await appliedCoupon.recordUsage(null, shippingAddress.phone);
      }

      await order.populate('items.product', 'name images');

      // Send notification (async, don't block response)
      notifyOrderCreated(order).catch(err => console.error('Notification error:', err));

      res.status(201).json({
        success: true,
        data: order,
        message: 'Đặt hàng thành công! Shop sẽ liên hệ xác nhận.',
      });
    } catch (error) {
      console.error('Guest order error:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra. Vui lòng thử lại.',
      });
    }
  }
);

// @route   GET /api/orders/guest/lookup
// @desc    Lookup guest order by order code/ID and phone
// @access  Public
router.get('/guest/lookup', async (req, res) => {
  try {
    const { orderId, phone } = req.query;

    if (!orderId || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mã đơn hàng và số điện thoại',
      });
    }

    // Clean phone number (remove spaces, dashes, dots)
    const cleanPhone = phone.replace(/[\s.-]/g, '');

    let order;

    // Check if it's an orderCode (starts with DH) or ObjectId
    if (orderId.toUpperCase().startsWith('DH')) {
      order = await Order.findOne({ orderCode: orderId.toUpperCase() })
        .populate('items.product', 'name images price');
    } else if (isValidObjectId(orderId)) {
      order = await Order.findById(orderId)
        .populate('items.product', 'name images price');
    } else {
      return res.status(400).json({
        success: false,
        message: 'Mã đơn hàng không hợp lệ. Vui lòng nhập mã dạng DH00001.',
      });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng',
      });
    }

    // Verify phone number matches
    const orderPhone = order.shippingAddress?.phone?.replace(/[\s.-]/g, '');
    if (orderPhone !== cleanPhone) {
      return res.status(403).json({
        success: false,
        message: 'Số điện thoại không khớp với đơn hàng',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Guest order lookup error:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra',
    });
  }
});

// @route   PUT /api/orders/guest/cancel
// @desc    Cancel guest order by order code/ID and phone verification
// @access  Public
router.put('/guest/cancel', async (req, res) => {
  try {
    const { orderId, phone, reason } = req.body;

    if (!orderId || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mã đơn hàng và số điện thoại',
      });
    }

    // Clean phone number
    const cleanPhone = phone.replace(/[\s.-]/g, '');

    let order;

    // Check if it's an orderCode (starts with DH) or ObjectId
    if (orderId.toUpperCase().startsWith('DH')) {
      order = await Order.findOne({ orderCode: orderId.toUpperCase() });
    } else if (isValidObjectId(orderId)) {
      order = await Order.findById(orderId);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Mã đơn hàng không hợp lệ',
      });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng',
      });
    }

    // Verify phone number matches
    const orderPhone = order.shippingAddress?.phone?.replace(/[\s.-]/g, '');
    if (orderPhone !== cleanPhone) {
      return res.status(403).json({
        success: false,
        message: 'Số điện thoại không khớp với đơn hàng',
      });
    }

    // Can only cancel pending, confirmed, or processing orders (before shipped)
    if (!['pending', 'confirmed', 'processing'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Không thể hủy đơn hàng đã giao hoặc đang vận chuyển. Vui lòng liên hệ hotline.',
      });
    }

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    order.orderStatus = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      note: reason || 'Khách hàng yêu cầu hủy đơn',
      date: new Date(),
    });

    await order.save();

    res.json({
      success: true,
      message: 'Đã hủy đơn hàng thành công',
      data: order,
    });
  } catch (error) {
    console.error('Guest cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra',
    });
  }
});

// @route   GET /api/orders/check-payment/:orderCode
// @desc    Check if payment has been confirmed for an order
// @access  Public
router.get('/check-payment/:orderCode', async (req, res) => {
  try {
    const { orderCode } = req.params;

    let order;
    if (orderCode.toUpperCase().startsWith('DH')) {
      order = await Order.findOne({ orderCode: orderCode.toUpperCase() });
    } else if (isValidObjectId(orderCode)) {
      order = await Order.findById(orderCode);
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng',
      });
    }

    res.json({
      success: true,
      data: {
        orderCode: order.orderCode,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        isPaid: order.paymentStatus === 'paid',
        paidAt: order.paymentDetails?.paidAt || null,
        hasPaymentProof: !!order.paymentProof?.image,
        paymentProofVerified: !!order.paymentProof?.verifiedAt,
      },
    });
  } catch (error) {
    console.error('Check payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra',
    });
  }
});

// @route   POST /api/orders/webhook/bank
// @desc    Webhook for bank payment notifications (Casso/SePay)
// @access  Public (secured by secret key)
router.post('/webhook/bank', webhookLimiter, async (req, res) => {
  try {
    // Verify webhook secret (Casso/SePay)
    const webhookSecret = req.headers['x-webhook-secret'] || req.headers['secure-token'];
    const expectedSecret = process.env.BANK_WEBHOOK_SECRET;

    // Security check - always verify webhook secret
    // Only skip if SKIP_WEBHOOK_VERIFY=true is explicitly set (for local testing only)
    const skipVerify = process.env.SKIP_WEBHOOK_VERIFY === 'true';

    if (!skipVerify) {
      // Warn if webhook secret is not configured
      if (!expectedSecret) {
        console.warn('⚠️ BANK_WEBHOOK_SECRET is not configured. Webhook rejected.');
        return res.status(401).json({
          success: false,
          message: 'Webhook secret not configured',
        });
      }

      // Verify the secret matches
      if (webhookSecret !== expectedSecret) {
        console.warn('⚠️ Invalid webhook secret received');
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }
    } else {
      console.warn('⚠️ Webhook verification SKIPPED (SKIP_WEBHOOK_VERIFY=true)');
    }

    // Parse transaction data (format varies by provider)
    // Casso format: { data: [{ tid, amount, description, when, ... }] }
    // SePay format: { id, gateway, amount, content, ... }
    const transactions = req.body.data || [req.body];

    let confirmedCount = 0;

    for (const transaction of transactions) {
      // Extract order code from transaction description/content
      const description = transaction.description || transaction.content || transaction.additionData || '';
      const amount = transaction.amount || transaction.transferAmount || 0;

      // Look for order code pattern (DH00001, DH00002, etc.)
      const orderCodeMatch = description.toUpperCase().match(/DH\d{5}/);

      if (!orderCodeMatch) {
        console.log('No order code found in transaction:', description);
        continue;
      }

      const orderCode = orderCodeMatch[0];
      const order = await Order.findOne({ orderCode });

      if (!order) {
        console.log('Order not found:', orderCode);
        continue;
      }

      // Verify amount matches (with some tolerance for fees)
      const expectedAmount = order.total;
      const amountDiff = Math.abs(amount - expectedAmount);
      const tolerance = expectedAmount * 0.02; // 2% tolerance

      if (amountDiff > tolerance && amount < expectedAmount) {
        console.log(`Amount mismatch for ${orderCode}: expected ${expectedAmount}, got ${amount}`);
        continue;
      }

      // Only update if not already paid
      if (order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        order.paymentDetails = {
          transactionId: transaction.tid || transaction.id || transaction.referenceNumber || `BANK-${Date.now()}`,
          paidAt: new Date(transaction.when || transaction.transactionDate || Date.now()),
        };

        // Auto confirm order if pending
        if (order.orderStatus === 'pending') {
          order.orderStatus = 'confirmed';
          order.statusHistory.push({
            status: 'confirmed',
            note: 'Tự động xác nhận sau khi nhận được thanh toán từ ngân hàng',
          });
        }

        await order.save();
        confirmedCount++;

        console.log(`✅ Payment confirmed for order ${orderCode}: ${amount}đ`);

        // Send notification
        notifyPaymentStatusChange(order, 'paid').catch(err =>
          console.error('Notification error:', err)
        );
      }
    }

    res.json({
      success: true,
      message: `Processed ${transactions.length} transactions, confirmed ${confirmedCount} orders`,
    });
  } catch (error) {
    console.error('Bank webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing error',
    });
  }
});

// @route   POST /api/orders/simulate-payment/:orderCode
// @desc    Simulate payment confirmation (for testing only)
// @access  Public (development only)
router.post('/simulate-payment/:orderCode', async (req, res) => {
  // Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: 'Not available in production',
    });
  }

  try {
    const { orderCode } = req.params;

    let order;
    if (orderCode.toUpperCase().startsWith('DH')) {
      order = await Order.findOne({ orderCode: orderCode.toUpperCase() });
    } else if (isValidObjectId(orderCode)) {
      order = await Order.findById(orderCode);
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng',
      });
    }

    if (order.paymentStatus === 'paid') {
      return res.json({
        success: true,
        message: 'Đơn hàng đã được thanh toán trước đó',
        data: { alreadyPaid: true },
      });
    }

    // Simulate payment confirmation
    order.paymentStatus = 'paid';
    order.paymentDetails = {
      transactionId: `SIM-${Date.now()}`,
      paidAt: new Date(),
    };

    if (order.orderStatus === 'pending') {
      order.orderStatus = 'confirmed';
      order.statusHistory.push({
        status: 'confirmed',
        note: 'Tự động xác nhận (simulation)',
      });
    }

    await order.save();

    res.json({
      success: true,
      message: 'Đã xác nhận thanh toán (simulation)',
      data: order,
    });
  } catch (error) {
    console.error('Simulate payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra',
    });
  }
});

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// @route   GET /api/orders
// @desc    Get user's orders (or all orders for admin)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    // Regular users only see their own orders
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    // Filter by status
    if (req.query.status) {
      query.orderStatus = req.query.status;
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/orders/stats/overview
// @desc    Get order statistics
// @access  Admin
// NOTE: This route MUST be defined before /:id to avoid "stats" being treated as an ID
router.get('/stats/overview', protect, admin, async (req, res) => {
  try {
    // Count total orders (all statuses)
    const totalOrders = await Order.countDocuments();

    // Calculate revenue only from DELIVERED orders
    const revenueStats = await Order.aggregate([
      {
        $match: { orderStatus: 'delivered' },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          deliveredOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$total' },
        },
      },
    ]);

    const statusCounts = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    // Extract revenue data or set defaults if no delivered orders
    const revenue = revenueStats[0] || {
      totalRevenue: 0,
      deliveredOrders: 0,
      averageOrderValue: 0,
    };

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: revenue.totalRevenue,
        deliveredOrders: revenue.deliveredOrders,
        averageOrderValue: revenue.averageOrderValue,
        statusCounts: statusCounts.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name images price');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check ownership (unless admin)
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   POST /api/orders
// @desc    Create a new order (for logged-in users)
// @access  Private
router.post(
  '/',
  protect,
  [
    body('items').isArray({ min: 1 }).withMessage('Vui lòng chọn ít nhất một sản phẩm'),
    body('shippingAddress').notEmpty().withMessage('Vui lòng nhập địa chỉ giao hàng'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: errors.array()[0].msg,
        });
      }

      const {
        items,
        shippingAddress,
        paymentMethod,
        deliveryDate,
        deliveryTime,
        giftMessage,
        note,
        couponCode,
      } = req.body;

      // Validate items and calculate totals
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(400).json({
            success: false,
            message: `Product not found: ${item.product}`,
          });
        }

        if (product.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name}`,
          });
        }

        orderItems.push({
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          image: product.images[0],
        });

        subtotal += product.price * item.quantity;

        // Reduce stock
        product.stock -= item.quantity;
        await product.save();
      }

      // Calculate shipping (Vietnamese format: free over 750000đ, else 30000đ)
      const shippingCost = subtotal >= 750000 ? 0 : 30000;
      const tax = 0; // No separate tax in Vietnam
      let discount = 0;
      let appliedCoupon = null;

      // Validate and apply coupon if provided
      if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
        if (coupon) {
          const validation = coupon.validateForOrder(
            subtotal,
            req.user._id,
            null,
            orderItems.map(item => ({ product: item.product }))
          );

          if (validation.isValid) {
            discount = coupon.calculateDiscount(subtotal);
            appliedCoupon = coupon;
          }
        }
      }

      const total = subtotal + shippingCost - discount;

      const order = await Order.create({
        user: req.user._id,
        items: orderItems,
        shippingAddress,
        paymentMethod: paymentMethod || 'cod',
        subtotal,
        shippingCost,
        tax,
        discount,
        total,
        deliveryDate,
        deliveryTime,
        giftMessage,
        note,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
      });

      // Record coupon usage
      if (appliedCoupon) {
        await appliedCoupon.recordUsage(req.user._id, null);
      }

      await order.populate('user', 'name email');
      await order.populate('items.product', 'name images');

      // Send notification (async, don't block response)
      notifyOrderCreated(order).catch(err => console.error('Notification error:', err));

      res.status(201).json({
        success: true,
        data: order,
      });
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  }
);

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Admin
router.put('/:id/status', protect, admin, async (req, res) => {
  try {
    const { status, note } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.orderStatus = status;
    if (note) {
      order.statusHistory.push({ status, note });
    }

    await order.save();

    // Send notification (async, don't block response)
    notifyOrderStatusChange(order, status, note).catch(err => console.error('Notification error:', err));

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   PUT /api/orders/:id/payment
// @desc    Update payment status
// @access  Admin
router.put('/:id/payment', protect, admin, async (req, res) => {
  try {
    const { paymentStatus, transactionId } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.paymentStatus = paymentStatus;
    if (paymentStatus === 'paid') {
      order.paymentDetails = {
        transactionId,
        paidAt: new Date(),
      };
    }

    await order.save();

    // Send notification (async, don't block response)
    notifyPaymentStatusChange(order, paymentStatus).catch(err => console.error('Notification error:', err));

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   PUT /api/orders/:id/verify-payment
// @desc    Verify payment proof and mark as paid
// @access  Admin
router.put('/:id/verify-payment', protect, admin, async (req, res) => {
  try {
    const { note } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng',
      });
    }

    if (!order.paymentProof?.image) {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng chưa có ảnh xác nhận thanh toán',
      });
    }

    // Update payment proof verification
    order.paymentProof.verifiedAt = new Date();
    order.paymentProof.verifiedBy = req.user._id;
    if (note) {
      order.paymentProof.note = note;
    }

    // Update payment status to paid
    order.paymentStatus = 'paid';
    order.paymentDetails = {
      ...order.paymentDetails,
      paidAt: new Date(),
    };

    // Auto confirm order if still pending
    if (order.orderStatus === 'pending') {
      order.orderStatus = 'confirmed';
      order.statusHistory.push({
        status: 'confirmed',
        note: 'Tự động xác nhận sau khi thanh toán được duyệt',
      });
    }

    await order.save();

    res.json({
      success: true,
      message: 'Đã xác nhận thanh toán thành công',
      data: order,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check ownership (unless admin)
    // Guest orders (user is null) cannot be cancelled through this route
    if (req.user.role !== 'admin') {
      if (!order.user) {
        return res.status(403).json({
          success: false,
          message: 'Đơn hàng khách vãng lai không thể hủy qua trang này. Vui lòng liên hệ hotline.',
        });
      }
      if (order.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized',
        });
      }
    }

    // Can only cancel pending, confirmed, or processing orders (before shipped)
    if (!['pending', 'confirmed', 'processing'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Không thể hủy đơn hàng đã giao hoặc đang vận chuyển. Vui lòng liên hệ hotline.',
      });
    }

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    order.orderStatus = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      note: req.body.reason || 'Cancelled by user',
    });

    await order.save();

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
