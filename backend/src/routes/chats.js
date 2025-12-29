const express = require('express');
const Chat = require('../models/Chat');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/chats
// @desc    Get all chats (admin)
// @access  Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by admin handling
    if (req.query.isAdminHandling !== undefined) {
      query.isAdminHandling = req.query.isAdminHandling === 'true';
    }

    // Search by customer name or phone
    if (req.query.search) {
      query.$or = [
        { 'customer.name': { $regex: req.query.search, $options: 'i' } },
        { 'customer.phone': { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const total = await Chat.countDocuments(query);
    const chats = await Chat.find(query)
      .populate('user', 'name email')
      .populate('handledBy', 'name')
      .sort({ lastActivity: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: chats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/chats/stats
// @desc    Get chat statistics
// @access  Admin
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const stats = await Chat.getStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get chat stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/chats/active
// @desc    Get active chats for dashboard
// @access  Admin
router.get('/active', protect, admin, async (req, res) => {
  try {
    const chats = await Chat.getActiveChats();
    res.json({
      success: true,
      data: chats,
    });
  } catch (error) {
    console.error('Get active chats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/chats/:id
// @desc    Get chat by ID with full messages
// @access  Admin
router.get('/:id', protect, admin, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('handledBy', 'name');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cuộc hội thoại',
      });
    }

    res.json({
      success: true,
      data: chat,
    });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   PUT /api/chats/:id/notes
// @desc    Update admin notes for a chat
// @access  Admin
router.put('/:id/notes', protect, admin, async (req, res) => {
  try {
    const { notes } = req.body;
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cuộc hội thoại',
      });
    }

    chat.adminNotes = notes;
    await chat.save();

    res.json({
      success: true,
      data: chat,
    });
  } catch (error) {
    console.error('Update notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   PUT /api/chats/:id/tags
// @desc    Update tags for a chat
// @access  Admin
router.put('/:id/tags', protect, admin, async (req, res) => {
  try {
    const { tags } = req.body;
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cuộc hội thoại',
      });
    }

    chat.tags = tags || [];
    await chat.save();

    res.json({
      success: true,
      data: chat,
    });
  } catch (error) {
    console.error('Update tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   DELETE /api/chats/:id
// @desc    Delete a chat
// @access  Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cuộc hội thoại',
      });
    }

    await chat.deleteOne();

    res.json({
      success: true,
      message: 'Đã xóa cuộc hội thoại',
    });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/chats/export
// @desc    Export chat history
// @access  Admin
router.get('/export/csv', protect, admin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const chats = await Chat.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    // Generate CSV
    const headers = 'ID,Khách hàng,SĐT,Email,Số tin nhắn,Trạng thái,Đánh giá,Ngày tạo\n';
    const rows = chats
      .map(
        (chat) =>
          `${chat._id},${chat.customer.name},${chat.customer.phone || ''},${
            chat.customer.email || ''
          },${chat.messages.length},${chat.status},${chat.rating?.score || ''},${
            chat.createdAt.toISOString()
          }`
      )
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=chats.csv');
    res.send(headers + rows);
  } catch (error) {
    console.error('Export chats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
