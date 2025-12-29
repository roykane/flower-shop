import { useState, useRef, useEffect, useCallback } from 'react';
import {
  HiOutlineChat,
  HiX,
  HiPaperAirplane,
  HiOutlineSparkles,
  HiOutlineUser,
  HiStar,
} from 'react-icons/hi';
import { connectChatSocket, disconnectChatSocket, getSessionId } from '@/utils/socket';
import { Socket } from 'socket.io-client';

interface Message {
  _id: string;
  content: string;
  sender: 'customer' | 'admin' | 'bot';
  senderName?: string;
  createdAt: string;
  isRead?: boolean;
}

// Quick replies - currently disabled but kept for future use
// interface QuickReply {
//   text: string;
//   icon: React.ReactNode;
// }
// const QUICK_REPLIES: QuickReply[] = [
//   { text: 'Xem sản phẩm', icon: <HiOutlineShoppingBag className="w-4 h-4" /> },
//   { text: 'Hoa cưới', icon: <HiOutlineHeart className="w-4 h-4" /> },
//   { text: 'Liên hệ', icon: <HiOutlinePhone className="w-4 h-4" /> },
//   { text: 'Giao hàng', icon: <HiOutlineQuestionMarkCircle className="w-4 h-4" /> },
// ];

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAdminOnline, setIsAdminOnline] = useState(false);
  const [isAdminHandling, setIsAdminHandling] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminTyping, setAdminTyping] = useState(false);
  const [isChatClosed, setIsChatClosed] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Show welcome message when chat opens for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        _id: `welcome_${Date.now()}`,
        content: `Xin chào! 👋 Cảm ơn bạn đã ghé thăm shop hoa của chúng tôi.

Bạn có thể nhắn tin trực tiếp tại đây hoặc liên hệ qua:
📞 Hotline: 0839 477 199
💬 Zalo: 0944 600 344

Chúng tôi sẵn sàng hỗ trợ bạn!`,
        sender: 'bot',
        createdAt: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  // Track session ID to detect logout/session reset
  const lastSessionIdRef = useRef<string | null>(null);

  // Connect to socket when chat opens
  useEffect(() => {
    if (isOpen && !socketRef.current) {
      const currentSessionId = getSessionId();

      // Check if session changed (e.g., after logout)
      if (lastSessionIdRef.current && lastSessionIdRef.current !== currentSessionId) {
        // Session changed, clear old messages
        setMessages([]);
        setIsChatClosed(false);
        setShowRating(false);
        setIsAdminHandling(false);
        setAdminName('');
        console.log('[ChatBot] Session changed, clearing messages');
      }
      lastSessionIdRef.current = currentSessionId;

      const socket = connectChatSocket();
      socketRef.current = socket;

      // Listen for events
      socket.on('chat:message', (message: Message) => {
        setMessages((prev) => [...prev, message]);
        setIsTyping(false);
        if (!isOpen) {
          setUnreadCount((prev) => prev + 1);
        }
      });

      socket.on('chat:history', (history: Message[]) => {
        setMessages(history);
      });

      socket.on('chat:adminStatus', ({ online }: { online: boolean }) => {
        setIsAdminOnline(online);
      });

      socket.on('chat:adminTookOver', ({ adminName: name }: { adminName: string }) => {
        setIsAdminHandling(true);
        setAdminName(name);
        setMessages((prev) => [
          ...prev,
          {
            _id: `system_${Date.now()}`,
            content: `${name} đã tham gia cuộc trò chuyện`,
            sender: 'bot',
            createdAt: new Date().toISOString(),
          },
        ]);
      });

      socket.on('chat:releasedToAI', () => {
        setIsAdminHandling(false);
        setAdminName('');
        setMessages((prev) => [
          ...prev,
          {
            _id: `system_${Date.now()}`,
            content: 'Bạn đang trò chuyện với trợ lý ảo',
            sender: 'bot',
            createdAt: new Date().toISOString(),
          },
        ]);
      });

      socket.on('chat:adminTyping', ({ isTyping: typing }: { isTyping: boolean }) => {
        setAdminTyping(typing);
      });

      socket.on('chat:closed', ({ message }: { message: string }) => {
        setIsChatClosed(true);
        setShowRating(true);
        setMessages((prev) => [
          ...prev,
          {
            _id: `system_${Date.now()}`,
            content: message,
            sender: 'bot',
            createdAt: new Date().toISOString(),
          },
        ]);
      });

      socket.on('chat:rated', () => {
        setShowRating(false);
      });

      // Handle disconnect (e.g., from logout)
      socket.on('disconnect', () => {
        console.log('[ChatBot] Socket disconnected');
        socketRef.current = null;
      });
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectChatSocket();
    };
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim() || !socketRef.current) return;

    // Reset closed state when customer sends a new message (chat will reopen on backend)
    if (isChatClosed) {
      setIsChatClosed(false);
      setShowRating(false);
    }

    if (!isAdminHandling) {
      setIsTyping(true);
    }

    socketRef.current.emit('customer:message', {
      content: text.trim(),
      customerInfo: {
        name: 'Khách',
      },
    });

    setInputValue('');
  }, [isAdminHandling, isChatClosed]);

  const handleTyping = useCallback(() => {
    if (!socketRef.current) return;

    socketRef.current.emit('customer:typing', true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('customer:typing', false);
    }, 1000);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  // Quick reply handler - currently disabled but kept for future use
  // const handleQuickReply = (reply: string) => {
  //   sendMessage(reply);
  // };

  const handleRatingSubmit = () => {
    if (!socketRef.current || rating === 0) return;

    socketRef.current.emit('customer:rate', {
      score: rating,
      feedback: ratingFeedback,
    });
  };

  const handleStartNewChat = () => {
    localStorage.removeItem('chat_session_id');
    setMessages([]);
    setIsChatClosed(false);
    setShowRating(false);
    setRating(0);
    setRatingFeedback('');
    disconnectChatSocket();
    socketRef.current = null;

    setTimeout(() => {
      const socket = connectChatSocket();
      socketRef.current = socket;
    }, 100);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-24 md:bottom-8 right-4 md:right-8 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          isOpen
            ? 'bg-neutral-600 hover:bg-neutral-700'
            : 'bg-gradient-to-r from-primary to-violet hover:shadow-xl'
        }`}
        aria-label={isOpen ? 'Đóng chat' : 'Mở chat'}
      >
        {isOpen ? (
          <HiX className="w-6 h-6 text-white" />
        ) : (
          <>
            <HiOutlineChat className="w-6 h-6 text-white" />
            <span
              className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                isAdminOnline ? 'bg-green-500' : 'bg-yellow-500'
              } animate-pulse`}
            />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -left-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-40 md:bottom-24 right-4 md:right-8 z-50 w-[calc(100%-2rem)] md:w-96 transition-all duration-300 ${
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-violet p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                {isAdminHandling ? (
                  <HiOutlineUser className="w-5 h-5" />
                ) : (
                  <HiOutlineSparkles className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">
                  {isAdminHandling ? adminName : 'Tư Vấn Viên AI'}
                </h3>
                <p className="text-xs text-white/80 flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isAdminHandling
                        ? 'bg-green-400'
                        : isAdminOnline
                        ? 'bg-green-400'
                        : 'bg-yellow-400'
                    } animate-pulse`}
                  />
                  {isAdminHandling
                    ? 'Đang hỗ trợ bạn'
                    : isAdminOnline
                    ? 'Nhân viên đang trực tuyến'
                    : 'Trợ lý ảo 24/7'}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto p-4 space-y-4 bg-neutral-50">
            {messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${message.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    message.sender === 'customer'
                      ? 'bg-gradient-to-r from-primary to-violet text-white rounded-br-md'
                      : message.sender === 'admin'
                      ? 'bg-blue-500 text-white rounded-bl-md'
                      : 'bg-white shadow-sm rounded-bl-md'
                  }`}
                >
                  {message.sender === 'admin' && message.senderName && (
                    <p className="text-[10px] text-white/70 mb-1">{message.senderName}</p>
                  )}
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      message.sender === 'customer' || message.sender === 'admin'
                        ? 'text-white/70'
                        : 'text-neutral-400'
                    }`}
                  >
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing indicators */}
            {(isTyping || adminTyping) && (
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

          {/* Rating Section */}
          {showRating && (
            <div className="px-4 py-3 border-t border-neutral-100 bg-white">
              <p className="text-sm font-medium text-neutral-700 mb-2">
                Đánh giá cuộc trò chuyện
              </p>
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`p-1 transition-colors ${
                      star <= rating ? 'text-amber-400' : 'text-neutral-300'
                    }`}
                  >
                    <HiStar className="w-6 h-6 fill-current" />
                  </button>
                ))}
              </div>
              <textarea
                value={ratingFeedback}
                onChange={(e) => setRatingFeedback(e.target.value)}
                placeholder="Góp ý của bạn (tùy chọn)"
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:border-primary focus:outline-none resize-none"
                rows={2}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleRatingSubmit}
                  disabled={rating === 0}
                  className="flex-1 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Gửi đánh giá
                </button>
                <button
                  onClick={handleStartNewChat}
                  className="px-4 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg"
                >
                  Chat mới
                </button>
              </div>
            </div>
          )}

          {/* Quick Replies - disabled */}
          {/* {messages.length <= 1 && !showRating && (
            <div className="px-4 py-2 border-t border-neutral-100 bg-white">
              <p className="text-xs text-neutral-500 mb-2">Câu hỏi thường gặp:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_REPLIES.map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickReply(reply.text)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-primary/10 hover:text-primary rounded-full text-xs font-medium transition-colors"
                  >
                    {reply.icon}
                    {reply.text}
                  </button>
                ))}
              </div>
            </div>
          )} */}

          {/* Input - show unless rating form is displayed */}
          {!showRating && (
            <form onSubmit={handleSubmit} className="p-3 border-t border-neutral-100 bg-white">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    handleTyping();
                  }}
                  placeholder={isChatClosed ? "Nhắn tin để tiếp tục cuộc trò chuyện..." : "Nhập tin nhắn..."}
                  className="flex-1 px-4 py-2.5 bg-neutral-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="px-4 py-2.5 bg-gradient-to-r from-primary to-violet text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <HiPaperAirplane className="w-5 h-5 rotate-90" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
