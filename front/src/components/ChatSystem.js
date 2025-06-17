"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { Send, X, MessageCircle, Search, Minimize2 } from "lucide-react";
import io from "socket.io-client";
import axios from "axios";

const ChatSystem = () => {
  const user = useSelector((state) => state.users);
  const allUsers = useSelector((state) => state.allUsers);

  // Socket and connection state
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  // UI state
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeConversation, setActiveConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Message state
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // User state
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});

  // SIMPLIFIED typing state
  const [typingUsers, setTypingUsers] = useState(new Map()); // userId -> {username, timestamp}
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Refs
  const messagesEndRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (user?.token) {
      console.log("🔌 Initializing socket connection for user:", user.username);
      initializeSocket();
    } else {
      console.log("❌ No user token, skipping socket initialization");
    }

    return () => {
      if (socketRef.current) {
        console.log("🧹 Cleaning up socket connection");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  const initializeSocket = useCallback(() => {
    const serverUrl =
      process.env.REACT_APP_SOCKET_URL || "http://localhost:3003";
    console.log("🔗 Connecting to socket server:", serverUrl);

    const newSocket = io(serverUrl, {
      auth: { token: user.token },
      transports: ["websocket", "polling"],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: true,
    });

    socketRef.current = newSocket;

    // Connection events
    newSocket.on("connect", () => {
      console.log("✅ Connected to chat server with ID:", newSocket.id);
      setIsConnected(true);
      setSocket(newSocket);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from server:", reason);
      setIsConnected(false);
      setTypingUsers(new Map());
    });

    newSocket.on("connect_error", (error) => {
      console.error("🚫 Connection error:", error.message);
      setIsConnected(false);
    });

    // User events
    newSocket.on("users_online", (users) => {
      console.log("👥 Received online users:", users.length);
      setOnlineUsers(users);
    });

    // Message events
    newSocket.on("message_received", (message) => {
      console.log("📨 MESSAGE RECEIVED:", {
        id: message._id,
        from: message.sender.username,
        content: message.content.substring(0, 30) + "...",
      });

      // Clear typing indicator for this user when they send a message
      setTypingUsers((prev) => {
        const newMap = new Map(prev);
        newMap.delete(message.sender._id);
        return newMap;
      });

      setMessages((prevMessages) => {
        const exists = prevMessages.some((msg) => msg._id === message._id);
        if (exists) {
          return prevMessages;
        }
        return [...prevMessages, message];
      });

      handleNewMessage(message);
    });

    newSocket.on("message_sent", (data) => {
      console.log("✅ Message sent confirmation:", data.tempId);
      setIsSending(false);
      updateMessageStatus(data.tempId, data.message);
    });

    newSocket.on("message_error", (error) => {
      console.error("❌ Message error:", error.error);
      setIsSending(false);
      alert("Failed to send message: " + error.error);
      removeFailedMessage(error.tempId);
    });

    newSocket.on("message_delivered", (data) => {
      console.log("📬 Message delivered:", data.messageId);
      updateMessageDeliveryStatus(data.messageId, "delivered");
    });

    // TYPING EVENTS - IMMEDIATE RESPONSE
    newSocket.on("user_typing", (data) => {
      console.log(
        "⌨️ RECEIVED TYPING EVENT:",
        data.username,
        "in conversation:",
        activeConversation?.username
      );

      // Only show typing if it's for the active conversation
      if (activeConversation?.userId === data.userId) {
        setTypingUsers((prev) => {
          const newMap = new Map(prev);
          newMap.set(data.userId, {
            username: data.username,
            timestamp: Date.now(),
          });
          console.log("👥 SHOWING TYPING BUBBLE for:", data.username);
          return newMap;
        });

        // Auto-clear after 3 seconds
        setTimeout(() => {
          setTypingUsers((prev) => {
            const newMap = new Map(prev);
            const typingData = newMap.get(data.userId);
            if (typingData && Date.now() - typingData.timestamp >= 3000) {
              newMap.delete(data.userId);
              console.log("🕐 Auto-cleared typing bubble for:", data.username);
            }
            return newMap;
          });
        }, 3000);
      }
    });

    newSocket.on("user_stop_typing", (data) => {
      console.log("⏹️ RECEIVED STOP TYPING EVENT:", data.userId);

      if (activeConversation?.userId === data.userId) {
        setTypingUsers((prev) => {
          const newMap = new Map(prev);
          const removed = newMap.delete(data.userId);
          if (removed) {
            console.log("🛑 REMOVED TYPING BUBBLE for user:", data.userId);
          }
          return newMap;
        });
      }
    });

    setSocket(newSocket);
  }, [user, activeConversation]);

  // Handle new incoming message
  const handleNewMessage = useCallback(
    (message) => {
      const senderId = message.sender._id || message.sender.id;

      if (activeConversation?.userId !== senderId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1,
        }));

        if (Notification.permission === "granted") {
          new Notification(`New message from ${message.sender.username}`, {
            body: message.content,
            icon: `https://ui-avatars.com/api/?name=${message.sender.username}&background=random`,
          });
        }
      } else {
        if (socket && isConnected) {
          socket.emit("mark_message_read", { messageId: message._id });
        }
      }

      setTimeout(() => {
        scrollToBottom();
      }, 100);
    },
    [activeConversation, socket, isConnected]
  );

  // Load messages for conversation
  const loadMessages = useCallback(
    async (userId) => {
      if (!user?.token) return;

      console.log("📚 Loading messages for user:", userId);
      setIsLoadingMessages(true);

      try {
        const response = await axios.get(
          `/api/messages/conversation/${userId}`,
          {
            headers: { Authorization: `bearer ${user.token}` },
          }
        );

        console.log("✅ Loaded", response.data.length, "messages");
        setMessages(response.data);

        await markMessagesAsRead(userId);

        setTimeout(() => {
          scrollToBottom();
        }, 200);
      } catch (error) {
        console.error("❌ Failed to load messages:", error);
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [user]
  );

  // Mark messages as read
  const markMessagesAsRead = useCallback(
    async (userId) => {
      if (!user?.token) return;

      try {
        await axios.put(
          `/api/messages/mark-read/${userId}`,
          {},
          { headers: { Authorization: `bearer ${user.token}` } }
        );
        setUnreadCounts((prev) => ({ ...prev, [userId]: 0 }));
      } catch (error) {
        console.error("❌ Failed to mark messages as read:", error);
      }
    },
    [user]
  );

  // Send message
  const sendMessage = useCallback(() => {
    if (
      !newMessage.trim() ||
      !activeConversation ||
      !socket ||
      !isConnected ||
      isSending
    ) {
      return;
    }

    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const messageContent = newMessage.trim();

    console.log("📤 SENDING MESSAGE to:", activeConversation.username);

    // STOP TYPING IMMEDIATELY when sending
    if (isTyping) {
      console.log("📤 STOP TYPING - Sending message");
      socket.emit("stop_typing", { recipient: activeConversation.userId });
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }

    // Create optimistic message
    const optimisticMessage = {
      _id: tempId,
      tempId,
      sender: {
        _id: user.id,
        username: user.username,
      },
      recipient: {
        _id: activeConversation.userId,
        username: activeConversation.username,
      },
      content: messageContent,
      timestamp: new Date(),
      status: "sending",
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage(""); // This will trigger handleInputChange with empty value
    setIsSending(true);

    // Send via socket
    socket.emit("send_message", {
      recipient: activeConversation.userId,
      content: messageContent,
      tempId,
    });

    setTimeout(() => {
      scrollToBottom();
    }, 100);
  }, [
    newMessage,
    activeConversation,
    socket,
    isConnected,
    isSending,
    user,
    isTyping,
  ]);

  // Stop typing
  const stopTyping = useCallback(() => {
    if (socket && activeConversation && isConnected && isTyping) {
      console.log("⏹️ MANUAL STOP TYPING to:", activeConversation.username);
      socket.emit("stop_typing", { recipient: activeConversation.userId });
      setIsTyping(false);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [socket, activeConversation, isConnected, isTyping]);

  // Update message status
  const updateMessageStatus = useCallback((tempId, realMessage) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.tempId === tempId ? { ...realMessage, status: "sent" } : msg
      )
    );
  }, []);

  // Remove failed message
  const removeFailedMessage = useCallback((tempId) => {
    setMessages((prev) => prev.filter((msg) => msg.tempId !== tempId));
  }, []);

  // Update delivery status
  const updateMessageDeliveryStatus = useCallback((messageId, status) => {
    setMessages((prev) =>
      prev.map((msg) => (msg._id === messageId ? { ...msg, status } : msg))
    );
  }, []);

  // Start conversation
  const startConversation = useCallback(
    async (userId, username) => {
      console.log("💬 Starting conversation with:", username);

      // Clear typing indicators when switching conversations
      setTypingUsers(new Map());
      stopTyping();

      setActiveConversation({ userId, username });
      setMessages([]);
      await loadMessages(userId);
    },
    [loadMessages, stopTyping]
  );

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // SIMPLIFIED INPUT CHANGE - IMMEDIATE TYPING DETECTION
  const handleInputChange = useCallback(
    (e) => {
      const value = e.target.value;
      setNewMessage(value);

      if (!socket || !activeConversation || !isConnected) return;

      const hasContent = value.trim().length > 0;

      console.log("📝 INPUT CHANGE:", {
        value: value.substring(0, 20) + (value.length > 20 ? "..." : ""),
        hasContent,
        isCurrentlyTyping: isTyping,
        inputLength: value.length,
      });

      if (hasContent) {
        // HAS CONTENT - Start typing if not already
        if (!isTyping) {
          console.log("🟢 START TYPING - Input has content");
          socket.emit("typing", { recipient: activeConversation.userId });
          setIsTyping(true);
        }

        // Clear existing timeout and set new one
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Auto-stop after 2 seconds of no changes
        typingTimeoutRef.current = setTimeout(() => {
          console.log("🕐 AUTO-STOP TYPING - 2 second timeout");
          if (socket && activeConversation && isConnected) {
            socket.emit("stop_typing", {
              recipient: activeConversation.userId,
            });
          }
          setIsTyping(false);
        }, 2000);
      } else {
        // NO CONTENT - Stop typing immediately
        if (isTyping) {
          console.log("🔴 STOP TYPING - Input is empty");
          socket.emit("stop_typing", { recipient: activeConversation.userId });
          setIsTyping(false);

          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
          }
        }
      }
    },
    [socket, activeConversation, isConnected, isTyping]
  );

  // Handle key press
  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  // Get online status
  const isUserOnline = useCallback(
    (userId) => {
      return onlineUsers.some((u) => u.userId === userId);
    },
    [onlineUsers]
  );

  // Get total unread
  const getTotalUnread = useCallback(() => {
    return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  }, [unreadCounts]);

  // Get typing display text
  const getTypingText = useCallback(() => {
    const typingUsersList = Array.from(typingUsers.values());
    if (typingUsersList.length === 0) return "";

    const names = typingUsersList.map((u) => u.username);
    if (names.length === 1) {
      return `${names[0]} is typing...`;
    } else if (names.length === 2) {
      return `${names[0]} and ${names[1]} are typing...`;
    } else {
      return `${names[0]} and ${names.length - 1} others are typing...`;
    }
  }, [typingUsers]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Clear typing when conversation changes
  useEffect(() => {
    setTypingUsers(new Map());
    stopTyping();
  }, [activeConversation, stopTyping]);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  if (!user) return null;

  const filteredUsers = allUsers.filter(
    (u) =>
      u.username !== user.username &&
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

          <div
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
              isConnected ? "bg-green-400" : "bg-red-400"
            }`}
          />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 ${
            isMinimized ? "w-80 h-16" : "w-96 h-[600px]"
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
                      className="w-10 h-10 rounded-full ring-2 ring-white"
                    />
                    {isUserOnline(activeConversation.userId) && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">
                      {activeConversation.username}
                    </h3>
                    <p className="text-xs opacity-75">
                      {getTypingText() ||
                        (isUserOnline(activeConversation.userId)
                          ? "Active now"
                          : "Offline")}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <MessageCircle className="w-8 h-8" />
                  <div>
                    <h3 className="font-semibold">Chats</h3>
                    <p className="text-xs opacity-75">
                      {isConnected
                        ? `${onlineUsers.length} online`
                        : "Connecting..."}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <div className="flex-1 h-[536px] overflow-hidden">
              {!activeConversation ? (
                // Users List
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2">
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
                            className="w-12 h-12 rounded-full"
                          />
                          {isUserOnline(u.id) && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
                          )}
                        </div>

                        <div className="ml-3 flex-1">
                          <p className="font-medium text-sm text-gray-900 dark:text-white">
                            {u.username}
                          </p>
                          <p className="text-xs text-gray-500">
                            {isUserOnline(u.id) ? "Active now" : "Offline"}
                          </p>
                        </div>

                        {unreadCounts[u.id] > 0 && (
                          <div className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                            {unreadCounts[u.id]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Active Conversation
                <div className="flex flex-col h-full">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
                    {isLoadingMessages ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                        <span className="ml-2 text-gray-500">
                          Loading messages...
                        </span>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">
                          No messages yet
                        </p>
                        <p className="text-sm text-gray-400">
                          Start the conversation!
                        </p>
                      </div>
                    ) : (
                      messages.map((message, index) => {
                        const isOwn =
                          message.sender._id === user.id ||
                          message.sender.username === user.username;

                        return (
                          <div
                            key={message._id || message.tempId || index}
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
                                className={`px-4 py-2 rounded-2xl shadow-sm ${
                                  isOwn
                                    ? `bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-md ${
                                        message.status === "sending"
                                          ? "opacity-70"
                                          : ""
                                      }`
                                    : "bg-white dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-600 rounded-bl-md"
                                }`}
                              >
                                <p className="text-sm leading-relaxed break-words">
                                  {message.content}
                                </p>

                                {isOwn && (
                                  <div className="flex items-center justify-end mt-1 space-x-1">
                                    <span className="text-xs opacity-75">
                                      {new Date(
                                        message.timestamp
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                    {message.status === "sending" && (
                                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                    )}
                                    {message.status === "sent" && (
                                      <div className="w-3 h-3 rounded-full bg-white/30" />
                                    )}
                                    {message.status === "delivered" && (
                                      <div className="flex space-x-0.5">
                                        <div className="w-2 h-2 rounded-full bg-white/50" />
                                        <div className="w-2 h-2 rounded-full bg-white/50" />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* TYPING BUBBLE - IMMEDIATE DISPLAY */}
                    {typingUsers.size > 0 && (
                      <div className="flex justify-start animate-fade-in">
                        <div className="flex items-center space-x-2">
                          <img
                            src={`https://ui-avatars.com/api/?name=${activeConversation.username}&background=random`}
                            alt={activeConversation.username}
                            className="w-6 h-6 rounded-full"
                          />
                          <div className="bg-white dark:bg-gray-700 px-4 py-3 rounded-2xl rounded-bl-md border border-gray-200 dark:border-gray-600 shadow-sm">
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                <div
                                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                  style={{ animationDelay: "0.1s" }}
                                />
                                <div
                                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                  style={{ animationDelay: "0.2s" }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">
                                {Array.from(typingUsers.values())
                                  .map((u) => u.username)
                                  .join(", ")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={handleInputChange}
                          onKeyPress={handleKeyPress}
                          placeholder={
                            isConnected ? "Type a message..." : "Connecting..."
                          }
                          disabled={!isConnected || isSending}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 text-sm"
                        />
                      </div>

                      <button
                        onClick={sendMessage}
                        disabled={
                          !newMessage.trim() || !isConnected || isSending
                        }
                        className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                      >
                        {isSending ? (
                          <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Back Button */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        setActiveConversation(null);
                        setMessages([]);
                        setTypingUsers(new Map());
                        stopTyping();
                      }}
                      className="w-full py-2 px-4 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-sm"
                    >
                      ← Back to Chats
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ChatSystem;
