"use client";

import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Send, X, MessageCircle, Search, Minimize2 } from "lucide-react";
import io from "socket.io-client";
import axios from "axios";

const ChatSystem = () => {
  const user = useSelector((state) => state.users);
  const allUsers = useSelector((state) => state.allUsers);
  const [socket, setSocket] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typing, setTyping] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (user && user.token) {
      const serverUrl =
        process.env.NODE_ENV === "production"
          ? window.location.origin
          : "http://localhost:3001";

      const newSocket = io(serverUrl, {
        auth: {
          token: user.token,
        },
        transports: ["websocket", "polling"],
      });

      newSocket.on("connect", () => {
        console.log("Connected to chat server");
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });

      newSocket.on("users_online", (users) => {
        setOnlineUsers(users);
      });

      newSocket.on("receive_message", (message) => {
        if (
          activeConversation &&
          message.sender._id === activeConversation.userId
        ) {
          setMessages((prev) => [...prev, message]);
          scrollToBottom();
        } else {
          setUnreadCounts((prev) => ({
            ...prev,
            [message.sender._id]: (prev[message.sender._id] || 0) + 1,
          }));
        }
      });

      newSocket.on("user_typing", (data) => {
        if (activeConversation && data.userId === activeConversation.userId) {
          setTyping(data.username);
          setTimeout(() => setTyping(null), 3000);
        }
      });

      newSocket.on("user_stop_typing", () => {
        setTyping(null);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async (userId) => {
    if (!user) return;
    try {
      const response = await axios.get(`/api/messages/conversation/${userId}`, {
        headers: { Authorization: `bearer ${user.token}` },
      });
      setMessages(response.data);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = () => {
    if (newMessage.trim() && activeConversation && socket) {
      socket.emit("send_message", {
        recipient: activeConversation.userId,
        content: newMessage,
      });

      const tempMessage = {
        sender: { _id: user.id, username: user.username },
        content: newMessage,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, tempMessage]);
      setNewMessage("");
      scrollToBottom();
    }
  };

  const handleTyping = () => {
    if (socket && activeConversation) {
      socket.emit("typing", { recipient: activeConversation.userId });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop_typing", { recipient: activeConversation.userId });
      }, 1000);
    }
  };

  const startConversation = (userId, username) => {
    setActiveConversation({ userId, username });
    fetchMessages(userId);
    setUnreadCounts((prev) => ({ ...prev, [userId]: 0 }));
  };

  const filteredUsers = allUsers.filter(
    (u) =>
      u.username !== user?.username &&
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isUserOnline = (userId) => {
    return onlineUsers.some((u) => u.userId === userId);
  };

  const getTotalUnread = () => {
    return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center"
        >
          <MessageCircle className="w-6 h-6 text-white" />
          {getTotalUnread() > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse font-bold">
              {getTotalUnread() > 99 ? "99+" : getTotalUnread()}
            </div>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 ${
            isMinimized ? "w-80 h-16" : "w-96 h-[500px]"
          }`}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-2xl">
            <div className="flex items-center space-x-3">
              {activeConversation ? (
                <>
                  <div className="relative">
                    <img
                      src={`https://ui-avatars.com/api/?name=${activeConversation.username}&background=random`}
                      alt={activeConversation.username}
                      className="w-8 h-8 rounded-full ring-2 ring-white"
                    />
                    {isUserOnline(activeConversation.userId) && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">
                      {activeConversation.username}
                    </h3>
                    <p className="text-xs opacity-75">
                      {isUserOnline(activeConversation.userId)
                        ? "Online"
                        : "Offline"}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <MessageCircle className="w-6 h-6" />
                  <h3 className="font-semibold">Messages</h3>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <div className="flex-1 h-[436px] overflow-hidden">
              {!activeConversation ? (
                // Users List
                <div className="h-full flex flex-col">
                  {/* Search */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Users List */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-3">
                      {(searchQuery
                        ? filteredUsers
                        : allUsers.filter((u) => u.username !== user.username)
                      ).map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl cursor-pointer transition-all duration-200"
                          onClick={() => startConversation(u.id, u.username)}
                        >
                          <div className="relative">
                            <img
                              src={`https://ui-avatars.com/api/?name=${u.username}&background=random`}
                              alt={u.username}
                              className="w-10 h-10 rounded-full"
                            />
                            {isUserOnline(u.id) && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="font-medium text-sm text-gray-900 dark:text-white">
                              {u.username}
                            </p>
                            <p className="text-xs text-gray-500">
                              {isUserOnline(u.id) ? "Online" : "Offline"}
                            </p>
                          </div>
                          {unreadCounts[u.id] > 0 && (
                            <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                              {unreadCounts[u.id]}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // Active Conversation
                <div className="flex flex-col h-full">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                    {messages.map((message, index) => {
                      const isOwn =
                        message.sender._id === user.id ||
                        message.sender.username === user.username;

                      return (
                        <div
                          key={index}
                          className={`flex ${
                            isOwn ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs ${
                              isOwn ? "" : "flex items-end space-x-2"
                            }`}
                          >
                            {!isOwn && (
                              <img
                                src={`https://ui-avatars.com/api/?name=${message.sender.username}&background=random`}
                                alt={message.sender.username}
                                className="w-6 h-6 rounded-full"
                              />
                            )}
                            <div
                              className={`px-4 py-3 rounded-2xl shadow-sm ${
                                isOwn
                                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-md"
                                  : "bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-md border border-gray-200 dark:border-gray-600"
                              }`}
                            >
                              <p className="text-sm leading-relaxed">
                                {message.content}
                              </p>
                              <p
                                className={`text-xs mt-1 ${
                                  isOwn ? "text-blue-100" : "text-gray-500"
                                }`}
                              >
                                {new Date(message.timestamp).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {typing && (
                      <div className="flex justify-start">
                        <div className="flex items-center space-x-2">
                          <img
                            src={`https://ui-avatars.com/api/?name=${activeConversation.username}&background=random`}
                            alt={activeConversation.username}
                            className="w-6 h-6 rounded-full"
                          />
                          <div className="bg-white dark:bg-gray-700 px-4 py-3 rounded-2xl rounded-bl-md border border-gray-200 dark:border-gray-600">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-3 items-center">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleTyping();
                          }}
                          placeholder="Type a message..."
                          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Back Button */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        setActiveConversation(null);
                        setMessages([]);
                      }}
                      className="w-full py-2 px-4 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    >
                      ← Back to Conversations
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatSystem;
