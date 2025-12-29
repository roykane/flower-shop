const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ['customer', 'admin', 'bot'],
      required: true,
    },
    senderName: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const chatSchema = new mongoose.Schema(
  {
    // Session ID for anonymous customers
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Customer info (optional - can be filled when they provide info)
    customer: {
      name: { type: String, default: 'Khách' },
      phone: { type: String },
      email: { type: String },
    },
    // If customer is logged in
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Messages in this conversation
    messages: [messageSchema],
    // Chat status
    status: {
      type: String,
      enum: ['active', 'waiting', 'closed', 'resolved'],
      default: 'active',
    },
    // Is admin currently handling this chat?
    isAdminHandling: {
      type: Boolean,
      default: false,
    },
    // Which admin is handling
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Admin took over at
    adminTookOverAt: {
      type: Date,
    },
    // Last activity timestamp
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    // Last message preview
    lastMessage: {
      content: String,
      sender: String,
      createdAt: Date,
    },
    // Customer is currently typing
    customerTyping: {
      type: Boolean,
      default: false,
    },
    // Admin is currently typing
    adminTyping: {
      type: Boolean,
      default: false,
    },
    // Unread count for admin
    unreadCount: {
      type: Number,
      default: 0,
    },
    // Tags for categorization
    tags: [String],
    // Notes from admin
    adminNotes: {
      type: String,
    },
    // Rating from customer after chat ends
    rating: {
      score: { type: Number, min: 1, max: 5 },
      feedback: String,
      ratedAt: Date,
    },
    // Metadata
    metadata: {
      userAgent: String,
      ipAddress: String,
      pageUrl: String,
      referrer: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
chatSchema.index({ status: 1, lastActivity: -1 });
chatSchema.index({ isAdminHandling: 1, status: 1 });
chatSchema.index({ 'customer.phone': 1 });
chatSchema.index({ user: 1 });

// Virtual for message count
chatSchema.virtual('messageCount').get(function () {
  return this.messages.length;
});

// Method to add a message
chatSchema.methods.addMessage = async function (sender, content, senderName = '') {
  const message = {
    sender,
    senderName,
    content,
    isRead: sender === 'customer' ? false : true,
  };

  this.messages.push(message);
  this.lastMessage = {
    content: content.substring(0, 100),
    sender,
    createdAt: new Date(),
  };
  this.lastActivity = new Date();

  // Increment unread count for customer messages
  if (sender === 'customer') {
    this.unreadCount += 1;
  }

  await this.save();
  return this.messages[this.messages.length - 1];
};

// Method for admin to take over
chatSchema.methods.adminTakeOver = async function (adminId) {
  this.isAdminHandling = true;
  this.handledBy = adminId;
  this.adminTookOverAt = new Date();
  this.status = 'active';
  await this.save();
};

// Method to release to AI
chatSchema.methods.releaseToAI = async function () {
  this.isAdminHandling = false;
  this.handledBy = null;
  await this.save();
};

// Method to mark messages as read
chatSchema.methods.markAsRead = async function () {
  const now = new Date();
  this.messages.forEach((msg) => {
    if (!msg.isRead && msg.sender === 'customer') {
      msg.isRead = true;
      msg.readAt = now;
    }
  });
  this.unreadCount = 0;
  await this.save();
};

// Method to close chat
chatSchema.methods.closeChat = async function (status = 'resolved') {
  this.status = status;
  this.isAdminHandling = false;
  await this.save();
};

// Static: Get active chats for admin dashboard
chatSchema.statics.getActiveChats = async function () {
  return this.find({
    status: { $in: ['active', 'waiting'] },
  })
    .populate('user', 'name email')
    .populate('handledBy', 'name')
    .sort({ unreadCount: -1, lastActivity: -1 });
};

// Static: Get chat statistics
chatSchema.statics.getStats = async function () {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [totalActive, totalWaiting, totalToday, unreadTotal] = await Promise.all([
    this.countDocuments({ status: 'active' }),
    this.countDocuments({ status: 'waiting', isAdminHandling: false }),
    this.countDocuments({ createdAt: { $gte: today } }),
    this.aggregate([
      { $match: { status: { $in: ['active', 'waiting'] } } },
      { $group: { _id: null, total: { $sum: '$unreadCount' } } },
    ]),
  ]);

  return {
    activeChats: totalActive,
    waitingChats: totalWaiting,
    todayChats: totalToday,
    unreadMessages: unreadTotal[0]?.total || 0,
  };
};

// Ensure virtuals are included
chatSchema.set('toJSON', { virtuals: true });
chatSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Chat', chatSchema);
