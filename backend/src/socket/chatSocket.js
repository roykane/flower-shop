const jwt = require('jsonwebtoken');
const Chat = require('../models/Chat');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/jwt');

// Store connected clients
const connectedCustomers = new Map(); // sessionId -> socketId
const connectedAdmins = new Map(); // odminId -> socketId

// AI Response patterns (same as frontend)
const STORE_CONTEXT = {
  name: 'MINH ANH - Mâm Quả & Hoa Cưới',
  hotline: '0839 477 199',
  zalo: '0944 600 344',
};

const AI_RESPONSES = [
  {
    patterns: [/xin chào|hello|hi|chào|hey/i],
    response: () =>
      `Xin chào! Chào mừng bạn đến với ${STORE_CONTEXT.name}! Tôi là trợ lý ảo, sẵn sàng hỗ trợ bạn 24/7. Bạn cần tư vấn về sản phẩm nào ạ?`,
  },
  {
    patterns: [/giá|bao nhiêu|chi phí|cost|price/i],
    response: `Giá sản phẩm của chúng tôi rất đa dạng:\n\n• Hoa bó: từ 200.000đ - 2.000.000đ\n• Hoa cưới: từ 500.000đ - 5.000.000đ\n• Mâm quả: từ 800.000đ - 3.000.000đ\n\nBạn có thể xem chi tiết tại mục "Sản Phẩm" hoặc cho tôi biết loại hoa bạn quan tâm!`,
  },
  {
    patterns: [/liên hệ|contact|số điện thoại|phone|hotline|zalo/i],
    response: () =>
      `Thông tin liên hệ:\n\n• Hotline: ${STORE_CONTEXT.hotline}\n• Zalo: ${STORE_CONTEXT.zalo}\n\nBạn có thể gọi trực tiếp hoặc nhắn Zalo, chúng tôi sẽ phản hồi ngay!`,
  },
  {
    patterns: [/giao hàng|delivery|ship|vận chuyển|freeship/i],
    response: `Chính sách giao hàng:\n\n• Giao hàng nhanh trong 2-4 giờ nội thành\n• Miễn phí giao hàng đơn từ 500.000đ\n• Giao tận nơi, cẩn thận\n• Hỗ trợ giao gấp trong ngày`,
  },
  {
    patterns: [/hoa cưới|wedding|cưới|dam cuoi/i],
    response: `Dịch vụ Hoa Cưới cao cấp:\n\n• Hoa cầm tay cô dâu\n• Hoa cài áo chú rể\n• Hoa trang trí xe hoa\n• Hoa bàn tiệc\n• Cổng hoa, backdrop\n\nĐặc biệt: Tư vấn miễn phí theo concept cưới!`,
  },
  {
    patterns: [/mâm quả|tráp|lễ ăn hỏi|dam hoi/i],
    response: `Dịch vụ Mâm Quả Cưới:\n\n• Mâm quả truyền thống 6-12 tráp\n• Mâm quả hiện đại, sang trọng\n• Trang trí theo yêu cầu\n• Cho thuê quả & phụ kiện\n\nCam kết: Quả tươi ngon, trang trí đẹp mắt!`,
  },
  {
    patterns: [/thanh toán|payment|trả tiền|chuyển khoản/i],
    response: `Phương thức thanh toán:\n\n• Tiền mặt khi nhận hàng (COD)\n• Chuyển khoản ngân hàng\n• Ví điện tử (MoMo, ZaloPay)\n\nAn toàn & tiện lợi!`,
  },
  {
    patterns: [/đặt hàng|order|mua|đặt mua/i],
    response: `Cách đặt hàng:\n\n1. Chọn sản phẩm yêu thích\n2. Thêm vào giỏ hàng\n3. Điền thông tin giao hàng\n4. Xác nhận & thanh toán\n\nHoặc gọi Hotline ${STORE_CONTEXT.hotline} để đặt hàng nhanh!`,
  },
  {
    patterns: [/cảm ơn|thank|thanks/i],
    response: `Cảm ơn bạn đã quan tâm đến ${STORE_CONTEXT.name}! Nếu cần hỗ trợ thêm, đừng ngại nhắn tin cho tôi nhé. Chúc bạn một ngày tuyệt vời!`,
  },
];

const getDefaultResponse = () => {
  const responses = [
    `Cảm ơn bạn đã liên hệ! Để được tư vấn chi tiết hơn, bạn có thể:\n\n• Gọi Hotline: ${STORE_CONTEXT.hotline}\n• Nhắn Zalo: ${STORE_CONTEXT.zalo}\n\nHoặc cho tôi biết bạn quan tâm đến sản phẩm nào?`,
    `Tôi hiểu bạn cần hỗ trợ! Bạn có thể hỏi về:\n\n• Sản phẩm & giá cả\n• Dịch vụ hoa cưới\n• Giao hàng & thanh toán\n\nHãy cho tôi biết thêm chi tiết nhé!`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
};

const getAIResponse = (message) => {
  const lowerMessage = message.toLowerCase();

  for (const { patterns, response } of AI_RESPONSES) {
    for (const pattern of patterns) {
      if (pattern.test(lowerMessage)) {
        return typeof response === 'function' ? response() : response;
      }
    }
  }

  return getDefaultResponse();
};

// Authenticate socket connection
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    console.log('[Socket Auth] Token present:', !!token);

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('[Socket Auth] Token decoded, userId:', decoded.id);

      const user = await User.findById(decoded.id);
      console.log('[Socket Auth] User found:', !!user, 'Role:', user?.role);

      if (user) {
        socket.user = user;
        socket.isAdmin = user.role === 'admin';
        console.log('[Socket Auth] isAdmin set to:', socket.isAdmin);
      }
    }

    // For customers, use session ID
    socket.sessionId = socket.handshake.auth.sessionId || socket.id;

    next();
  } catch (error) {
    console.error('[Socket Auth] Error:', error.message);
    // Allow connection even without valid token (for customers)
    socket.sessionId = socket.handshake.auth.sessionId || socket.id;
    next();
  }
};

// Initialize chat socket
const initializeChatSocket = (io) => {
  const chatNamespace = io.of('/chat');

  chatNamespace.use(authenticateSocket);

  chatNamespace.on('connection', async (socket) => {
    console.log(`[Socket] Connected: ${socket.id}, isAdmin: ${socket.isAdmin}, user: ${socket.user?.name || 'N/A'}`);

    // Register admin
    if (socket.isAdmin) {
      connectedAdmins.set(socket.user._id.toString(), socket.id);
      socket.join('admins');
      console.log('[Socket] Admin registered:', socket.user.name);

      // Send initial stats
      const stats = await Chat.getStats();
      console.log('[Socket] Sending stats to admin:', stats);
      socket.emit('chat:stats', stats);

      // Send active chats list
      const activeChats = await Chat.getActiveChats();
      console.log('[Socket] Sending chat list to admin, count:', activeChats.length);
      socket.emit('chat:list', activeChats);
    }

    // Register customer
    if (!socket.isAdmin) {
      connectedCustomers.set(socket.sessionId, socket.id);
      socket.join(`customer:${socket.sessionId}`);

      // Get or create chat session
      let chat = await Chat.findOne({ sessionId: socket.sessionId });

      if (!chat) {
        chat = await Chat.create({
          sessionId: socket.sessionId,
          user: socket.user?._id,
          customer: {
            name: socket.user?.name || 'Khách',
          },
          metadata: {
            userAgent: socket.handshake.headers['user-agent'],
          },
        });

        // Send welcome message
        const welcomeMsg = await chat.addMessage(
          'bot',
          `Xin chào! Tôi là trợ lý ảo của ${STORE_CONTEXT.name}.\n\nTôi có thể giúp bạn:\n• Tư vấn sản phẩm\n• Thông tin giá cả\n• Hướng dẫn đặt hàng\n\nBạn cần hỗ trợ gì ạ?`,
          'Bot'
        );

        socket.emit('chat:message', welcomeMsg);
      } else {
        // Send existing messages
        socket.emit('chat:history', chat.messages);
      }

      // Send admin online status
      const adminOnline = connectedAdmins.size > 0;
      socket.emit('chat:adminStatus', { online: adminOnline });

      // Notify admins about new/returning customer
      chatNamespace.to('admins').emit('chat:customerJoined', {
        sessionId: socket.sessionId,
        chat: chat,
      });
    }

    // =====================
    // CUSTOMER EVENTS
    // =====================

    // Customer sends message
    socket.on('customer:message', async (data) => {
      try {
        const { content, customerInfo } = data;
        let chat = await Chat.findOne({ sessionId: socket.sessionId });
        let wasReopened = false;

        if (!chat) {
          chat = await Chat.create({
            sessionId: socket.sessionId,
            customer: customerInfo || { name: 'Khách' },
          });
        } else if (chat.status === 'closed' || chat.status === 'resolved') {
          // Reopen closed/resolved chat when customer sends new message
          chat.status = 'active';
          chat.isAdminHandling = false;
          chat.handledBy = null;
          wasReopened = true;
          console.log('[Socket] Reopening closed chat:', chat._id);
        }

        // Update customer info if provided
        if (customerInfo) {
          chat.customer = { ...chat.customer, ...customerInfo };
        }

        // Add customer message
        const message = await chat.addMessage('customer', content, chat.customer.name);

        // Emit to customer
        socket.emit('chat:message', message);

        // Emit to admins
        chatNamespace.to('admins').emit('chat:newMessage', {
          chatId: chat._id,
          sessionId: socket.sessionId,
          message,
          chat: await Chat.findById(chat._id).populate('handledBy', 'name'),
        });

        // Update stats for admins
        const stats = await Chat.getStats();
        chatNamespace.to('admins').emit('chat:stats', stats);

        // If chat was reopened, update chat list for admins
        if (wasReopened) {
          const activeChats = await Chat.getActiveChats();
          chatNamespace.to('admins').emit('chat:list', activeChats);
          console.log('[Socket] Sent updated chat list to admins after reopening');
        }

        // If no admin handling, send AI response
        if (!chat.isAdminHandling) {
          const chatId = chat._id;
          setTimeout(async () => {
            // Re-check if admin took over during the delay
            const currentChat = await Chat.findById(chatId);
            if (currentChat && !currentChat.isAdminHandling) {
              const aiResponse = getAIResponse(content);
              const botMessage = await currentChat.addMessage('bot', aiResponse, 'Bot');

              socket.emit('chat:message', botMessage);

              chatNamespace.to('admins').emit('chat:newMessage', {
                chatId: currentChat._id,
                sessionId: socket.sessionId,
                message: botMessage,
              });
            }
          }, 800 + Math.random() * 700);
        }
      } catch (error) {
        console.error('Customer message error:', error);
        socket.emit('chat:error', { message: 'Có lỗi xảy ra' });
      }
    });

    // Customer typing
    socket.on('customer:typing', async (isTyping) => {
      try {
        const chat = await Chat.findOne({ sessionId: socket.sessionId });
        if (chat) {
          chat.customerTyping = isTyping;
          await chat.save();

          if (chat.handledBy) {
            const adminSocketId = connectedAdmins.get(chat.handledBy.toString());
            if (adminSocketId) {
              chatNamespace.to(adminSocketId).emit('chat:customerTyping', {
                chatId: chat._id,
                isTyping,
              });
            }
          }
        }
      } catch (error) {
        console.error('Typing indicator error:', error);
      }
    });

    // Customer rates chat
    socket.on('customer:rate', async (data) => {
      try {
        const { score, feedback } = data;
        const chat = await Chat.findOne({ sessionId: socket.sessionId });

        if (chat) {
          chat.rating = {
            score,
            feedback,
            ratedAt: new Date(),
          };
          await chat.save();

          socket.emit('chat:rated', { success: true });

          // Notify admin
          chatNamespace.to('admins').emit('chat:rated', {
            chatId: chat._id,
            rating: chat.rating,
          });
        }
      } catch (error) {
        console.error('Rating error:', error);
      }
    });

    // =====================
    // ADMIN EVENTS
    // =====================

    // Admin takes over chat
    socket.on('admin:takeOver', async (data) => {
      if (!socket.isAdmin) return;

      try {
        const { chatId } = data;
        const chat = await Chat.findById(chatId);

        if (chat) {
          await chat.adminTakeOver(socket.user._id);

          // Join admin to specific chat room
          socket.join(`chat:${chatId}`);

          // Notify customer
          const customerSocketId = connectedCustomers.get(chat.sessionId);
          if (customerSocketId) {
            chatNamespace.to(customerSocketId).emit('chat:adminTookOver', {
              adminName: socket.user.name,
            });
          }

          // Notify other admins
          chatNamespace.to('admins').emit('chat:updated', {
            chatId,
            isAdminHandling: true,
            handledBy: { _id: socket.user._id, name: socket.user.name },
          });

          socket.emit('admin:takeOverSuccess', { chatId });
        }
      } catch (error) {
        console.error('Take over error:', error);
        socket.emit('chat:error', { message: 'Không thể tiếp quản chat' });
      }
    });

    // Admin sends message
    socket.on('admin:message', async (data) => {
      if (!socket.isAdmin) return;

      try {
        const { chatId, content } = data;
        const chat = await Chat.findById(chatId);

        if (chat) {
          const message = await chat.addMessage('admin', content, socket.user.name);

          // Emit to customer
          const customerSocketId = connectedCustomers.get(chat.sessionId);
          if (customerSocketId) {
            chatNamespace.to(customerSocketId).emit('chat:message', message);
          }

          // Emit to admin
          socket.emit('chat:message', { chatId, message });

          // Update chat list for other admins
          chatNamespace.to('admins').emit('chat:messageUpdate', {
            chatId,
            lastMessage: chat.lastMessage,
          });
        }
      } catch (error) {
        console.error('Admin message error:', error);
        socket.emit('chat:error', { message: 'Không thể gửi tin nhắn' });
      }
    });

    // Admin typing
    socket.on('admin:typing', async (data) => {
      if (!socket.isAdmin) return;

      try {
        const { chatId, isTyping } = data;
        const chat = await Chat.findById(chatId);

        if (chat) {
          chat.adminTyping = isTyping;
          await chat.save();

          const customerSocketId = connectedCustomers.get(chat.sessionId);
          if (customerSocketId) {
            chatNamespace.to(customerSocketId).emit('chat:adminTyping', { isTyping });
          }
        }
      } catch (error) {
        console.error('Admin typing error:', error);
      }
    });

    // Admin releases chat to AI
    socket.on('admin:release', async (data) => {
      if (!socket.isAdmin) return;

      try {
        const { chatId } = data;
        const chat = await Chat.findById(chatId);

        if (chat) {
          await chat.releaseToAI();

          // Notify customer
          const customerSocketId = connectedCustomers.get(chat.sessionId);
          if (customerSocketId) {
            chatNamespace.to(customerSocketId).emit('chat:releasedToAI');
          }

          // Notify admins
          chatNamespace.to('admins').emit('chat:updated', {
            chatId,
            isAdminHandling: false,
            handledBy: null,
          });

          socket.emit('admin:releaseSuccess', { chatId });
        }
      } catch (error) {
        console.error('Release error:', error);
      }
    });

    // Admin closes chat
    socket.on('admin:closeChat', async (data) => {
      if (!socket.isAdmin) return;

      try {
        const { chatId, status } = data;
        const chat = await Chat.findById(chatId);

        if (chat) {
          await chat.closeChat(status || 'resolved');

          // Notify customer
          const customerSocketId = connectedCustomers.get(chat.sessionId);
          if (customerSocketId) {
            chatNamespace.to(customerSocketId).emit('chat:closed', {
              message: 'Cuộc trò chuyện đã kết thúc. Cảm ơn bạn đã liên hệ!',
            });
          }

          // Update stats
          const stats = await Chat.getStats();
          chatNamespace.to('admins').emit('chat:stats', stats);

          // Update chat list
          const activeChats = await Chat.getActiveChats();
          chatNamespace.to('admins').emit('chat:list', activeChats);
        }
      } catch (error) {
        console.error('Close chat error:', error);
      }
    });

    // Admin marks messages as read
    socket.on('admin:markRead', async (data) => {
      if (!socket.isAdmin) return;

      try {
        const { chatId } = data;
        const chat = await Chat.findById(chatId);

        if (chat) {
          await chat.markAsRead();

          // Update stats
          const stats = await Chat.getStats();
          chatNamespace.to('admins').emit('chat:stats', stats);
        }
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // Admin requests chat list
    socket.on('admin:getChats', async () => {
      if (!socket.isAdmin) return;

      try {
        const activeChats = await Chat.getActiveChats();
        socket.emit('chat:list', activeChats);
      } catch (error) {
        console.error('Get chats error:', error);
      }
    });

    // Admin requests stats
    socket.on('admin:getStats', async () => {
      if (!socket.isAdmin) return;

      try {
        const stats = await Chat.getStats();
        socket.emit('chat:stats', stats);
      } catch (error) {
        console.error('Get stats error:', error);
      }
    });

    // =====================
    // DISCONNECT
    // =====================

    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id}`);

      if (socket.isAdmin) {
        connectedAdmins.delete(socket.user._id.toString());

        // Notify customers that admin went offline
        if (connectedAdmins.size === 0) {
          chatNamespace.emit('chat:adminStatus', { online: false });
        }
      } else {
        connectedCustomers.delete(socket.sessionId);

        // Notify admins that customer left
        chatNamespace.to('admins').emit('chat:customerLeft', {
          sessionId: socket.sessionId,
        });
      }
    });
  });

  return chatNamespace;
};

module.exports = { initializeChatSocket };
