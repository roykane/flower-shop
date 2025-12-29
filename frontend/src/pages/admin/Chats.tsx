import { useState, useEffect, useRef, useCallback } from 'react';
import {
  HiOutlineChat,
  HiOutlineUser,
  HiOutlinePhone,
  HiPaperAirplane,
  HiOutlineSparkles,
  HiOutlineX,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineRefresh,
} from 'react-icons/hi';
import { connectAdminSocket, disconnectAdminSocket } from '@/utils/socket';
import { Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

interface Message {
  _id: string;
  content: string;
  sender: 'customer' | 'admin' | 'bot';
  senderName?: string;
  createdAt: string;
  isRead?: boolean;
}

interface Chat {
  _id: string;
  sessionId: string;
  customer: {
    name: string;
    phone?: string;
    email?: string;
  };
  messages: Message[];
  status: 'active' | 'waiting' | 'closed' | 'resolved';
  isAdminHandling: boolean;
  handledBy?: {
    _id: string;
    name: string;
  };
  lastMessage?: {
    content: string;
    sender: string;
    createdAt: string;
  };
  unreadCount: number;
  customerTyping?: boolean;
  createdAt: string;
}

interface ChatStats {
  activeChats: number;
  waitingChats: number;
  todayChats: number;
  unreadMessages: number;
}

export default function AdminChats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [stats, setStats] = useState<ChatStats>({
    activeChats: 0,
    waitingChats: 0,
    todayChats: 0,
    unreadMessages: 0,
  });
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [filter, setFilter] = useState<'all' | 'waiting' | 'active'>('all');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChat?.messages]);

  // Connect to socket
  useEffect(() => {
    const socket = connectAdminSocket();
    socketRef.current = socket;

    // If already connected, emit admin requests immediately
    if (socket.connected) {
      setIsConnected(true);
      socket.emit('admin:getChats');
      socket.emit('admin:getStats');
    }

    socket.on('connect', () => {
      console.log('[Admin Chat] Socket connected');
      setIsConnected(true);
      socket.emit('admin:getChats');
      socket.emit('admin:getStats');
    });

    socket.on('disconnect', () => {
      console.log('[Admin Chat] Socket disconnected');
      setIsConnected(false);
    });

    socket.on('chat:list', (chatList: Chat[]) => {
      console.log('[Admin Chat] Received chat list:', chatList.length, 'chats');
      setChats(chatList);
    });

    socket.on('chat:stats', (newStats: ChatStats) => {
      console.log('[Admin Chat] Received stats:', newStats);
      setStats(newStats);
    });

    // Handle admin's own messages (sent back from server)
    socket.on('chat:message', ({ chatId, message }: { chatId: string; message: Message }) => {
      console.log('[Admin Chat] Received own message:', message);
      // Update the selected chat with the new message
      setSelectedChat((prev) =>
        prev && prev._id === chatId
          ? {
              ...prev,
              messages: [...prev.messages, message],
            }
          : prev
      );

      // Also update the chats list
      setChats((prev) =>
        prev.map((c) => {
          if (c._id === chatId) {
            return {
              ...c,
              messages: [...c.messages, message],
              lastMessage: {
                content: message.content,
                sender: message.sender,
                createdAt: message.createdAt,
              },
            };
          }
          return c;
        })
      );
    });

    socket.on('chat:newMessage', ({ chatId, message, chat }: { chatId: string; message: Message; chat?: Chat }) => {
      setChats((prev) =>
        prev.map((c) => {
          if (c._id === chatId) {
            return {
              ...c,
              messages: [...c.messages, message],
              lastMessage: {
                content: message.content,
                sender: message.sender,
                createdAt: message.createdAt,
              },
              unreadCount: c.unreadCount + (message.sender === 'customer' ? 1 : 0),
            };
          }
          return c;
        })
      );

      // Update selected chat if viewing
      if (selectedChat?._id === chatId) {
        setSelectedChat((prev) =>
          prev
            ? {
                ...prev,
                messages: [...prev.messages, message],
              }
            : null
        );
      }

      // Show notification for new customer message
      if (message.sender === 'customer') {
        toast.success(`Tin nhắn mới từ ${chat?.customer.name || 'Khách'}`, {
          icon: '💬',
        });
      }
    });

    socket.on('chat:customerJoined', ({ chat }: { chat: Chat }) => {
      setChats((prev) => {
        const exists = prev.find((c) => c._id === chat._id);
        if (exists) return prev;
        return [chat, ...prev];
      });
      toast.success(`Khách hàng mới đang chờ hỗ trợ`, { icon: '👋' });
    });

    socket.on('chat:customerLeft', ({ sessionId }: { sessionId: string }) => {
      setChats((prev) =>
        prev.map((c) => (c.sessionId === sessionId ? { ...c, status: 'closed' as const } : c))
      );
    });

    socket.on('chat:customerTyping', ({ chatId, isTyping }: { chatId: string; isTyping: boolean }) => {
      setChats((prev) =>
        prev.map((c) => (c._id === chatId ? { ...c, customerTyping: isTyping } : c))
      );
      if (selectedChat?._id === chatId) {
        setSelectedChat((prev) => (prev ? { ...prev, customerTyping: isTyping } : null));
      }
    });

    socket.on('chat:updated', (update: Partial<Chat> & { chatId: string }) => {
      setChats((prev) =>
        prev.map((c) => (c._id === update.chatId ? { ...c, ...update } : c))
      );
    });

    socket.on('admin:takeOverSuccess', ({ chatId }: { chatId: string }) => {
      toast.success('Đã tiếp quản cuộc trò chuyện');
    });

    socket.on('admin:releaseSuccess', ({ chatId }: { chatId: string }) => {
      toast.success('Đã chuyển về AI');
    });

    socket.on('chat:error', ({ message }: { message: string }) => {
      toast.error(message);
    });

    return () => {
      disconnectAdminSocket();
    };
  }, []);

  // Update selected chat when chats list updates
  useEffect(() => {
    if (selectedChat) {
      const updated = chats.find((c) => c._id === selectedChat._id);
      if (updated) {
        setSelectedChat(updated);
      }
    }
  }, [chats]);

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    socketRef.current?.emit('admin:markRead', { chatId: chat._id });
  };

  const handleTakeOver = useCallback(() => {
    if (!selectedChat || !socketRef.current) return;
    socketRef.current.emit('admin:takeOver', { chatId: selectedChat._id });
  }, [selectedChat]);

  const handleRelease = useCallback(() => {
    if (!selectedChat || !socketRef.current) return;
    socketRef.current.emit('admin:release', { chatId: selectedChat._id });
  }, [selectedChat]);

  const handleCloseChat = useCallback(() => {
    if (!selectedChat || !socketRef.current) return;
    socketRef.current.emit('admin:closeChat', { chatId: selectedChat._id, status: 'resolved' });
    setSelectedChat(null);
  }, [selectedChat]);

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputValue.trim() || !selectedChat || !socketRef.current) return;

      socketRef.current.emit('admin:message', {
        chatId: selectedChat._id,
        content: inputValue.trim(),
      });

      setInputValue('');
    },
    [inputValue, selectedChat]
  );

  const handleTyping = useCallback(() => {
    if (!selectedChat || !socketRef.current) return;

    socketRef.current.emit('admin:typing', { chatId: selectedChat._id, isTyping: true });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('admin:typing', { chatId: selectedChat._id, isTyping: false });
    }, 1000);
  }, [selectedChat]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Vừa xong';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  const filteredChats = chats.filter((chat) => {
    if (filter === 'waiting') return !chat.isAdminHandling && chat.status === 'active';
    if (filter === 'active') return chat.isAdminHandling;
    return chat.status !== 'closed' && chat.status !== 'resolved';
  });

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-heading text-neutral-800">Quản lý Chat</h1>
          <p className="text-sm text-neutral-500">Hỗ trợ khách hàng trực tuyến</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg">
              <HiOutlineExclamationCircle className="w-4 h-4" />
              <span>{stats.waitingChats} chờ hỗ trợ</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg">
              <HiOutlineChat className="w-4 h-4" />
              <span>{stats.activeChats} đang chat</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg">
              <span>{stats.unreadMessages} tin chưa đọc</span>
            </div>
          </div>
          {/* Connection status */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${
              isConnected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            {isConnected ? 'Đang kết nối' : 'Mất kết nối'}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Chat list */}
        <div className="w-80 flex flex-col bg-white rounded-xl border border-neutral-200 overflow-hidden">
          {/* Filter tabs */}
          <div className="flex border-b border-neutral-100">
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'waiting', label: 'Chờ hỗ trợ' },
              { key: 'active', label: 'Đang chat' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Chat list */}
          <div className="flex-1 overflow-y-auto">
            {filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-neutral-400">
                <HiOutlineChat className="w-12 h-12 mb-2" />
                <p>Không có cuộc trò chuyện</p>
              </div>
            ) : (
              filteredChats.map((chat) => (
                <button
                  key={chat._id}
                  onClick={() => handleSelectChat(chat)}
                  className={`w-full p-3 text-left border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${
                    selectedChat?._id === chat._id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                        <HiOutlineUser className="w-5 h-5 text-neutral-500" />
                      </div>
                      {chat.customerTyping && (
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">{chat.customer.name}</span>
                        <span className="text-[10px] text-neutral-400">
                          {chat.lastMessage && formatTime(chat.lastMessage.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 truncate mt-0.5">
                        {chat.lastMessage?.content || 'Chưa có tin nhắn'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {chat.isAdminHandling ? (
                          <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                            {chat.handledBy?.name || 'Admin'}
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                            AI đang trả lời
                          </span>
                        )}
                        {chat.unreadCount > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-red-500 text-white rounded-full">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat detail */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-neutral-200 overflow-hidden">
          {selectedChat ? (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                    <HiOutlineUser className="w-5 h-5 text-neutral-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">{selectedChat.customer.name}</h3>
                    {selectedChat.customer.phone && (
                      <p className="text-xs text-neutral-500 flex items-center gap-1">
                        <HiOutlinePhone className="w-3 h-3" />
                        {selectedChat.customer.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedChat.isAdminHandling ? (
                    <>
                      <button
                        onClick={handleRelease}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200"
                      >
                        <HiOutlineSparkles className="w-4 h-4" />
                        Chuyển về AI
                      </button>
                      <button
                        onClick={handleCloseChat}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                      >
                        <HiOutlineCheckCircle className="w-4 h-4" />
                        Kết thúc
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleTakeOver}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90"
                    >
                      <HiOutlineChat className="w-4 h-4" />
                      Tiếp quản
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50">
                {selectedChat.messages.map((message) => (
                  <div
                    key={message._id}
                    className={`flex ${
                      message.sender === 'customer' ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                        message.sender === 'customer'
                          ? 'bg-white shadow-sm rounded-bl-md'
                          : message.sender === 'admin'
                          ? 'bg-blue-500 text-white rounded-br-md'
                          : 'bg-neutral-200 rounded-br-md'
                      }`}
                    >
                      {message.sender !== 'customer' && message.senderName && (
                        <p
                          className={`text-[10px] mb-1 ${
                            message.sender === 'admin' ? 'text-white/70' : 'text-neutral-500'
                          }`}
                        >
                          {message.senderName}
                        </p>
                      )}
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                      <p
                        className={`text-[10px] mt-1 ${
                          message.sender === 'admin' ? 'text-white/70' : 'text-neutral-400'
                        }`}
                      >
                        {new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Customer typing indicator */}
                {selectedChat.customerTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" />
                        <span
                          className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0.1s' }}
                        />
                        <span
                          className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0.2s' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {selectedChat.isAdminHandling && (
                <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        handleTyping();
                      }}
                      placeholder="Nhập tin nhắn..."
                      className="flex-1 px-4 py-2.5 bg-neutral-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white"
                    />
                    <button
                      type="submit"
                      disabled={!inputValue.trim()}
                      className="px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <HiPaperAirplane className="w-5 h-5 rotate-90" />
                    </button>
                  </div>
                </form>
              )}

              {/* Not handling message */}
              {!selectedChat.isAdminHandling && (
                <div className="p-4 border-t border-neutral-100 text-center text-sm text-neutral-500">
                  <p>Bấm "Tiếp quản" để trả lời khách hàng trực tiếp</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-400">
              <HiOutlineChat className="w-16 h-16 mb-4" />
              <p className="text-lg">Chọn một cuộc trò chuyện</p>
              <p className="text-sm">để bắt đầu hỗ trợ khách hàng</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
