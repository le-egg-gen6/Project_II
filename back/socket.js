const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/user");
const Message = require("./models/message");

let io;
const connectedUsers = new Map();

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin:
        process.env.NODE_ENV === "production"
          ? false
          : ["http://localhost:3000", "http://localhost:3001"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        console.error("❌ No token provided");
        return next(new Error("No token provided"));
      }

      const decodedToken = jwt.verify(token, process.env.SECRET);
      const user = await User.findById(decodedToken.id);

      if (!user) {
        console.error("❌ User not found for token");
        return next(new Error("User not found"));
      }

      socket.userId = user._id.toString();
      socket.username = user.username;
      console.log("✅ Socket authenticated for user:", user.username);
      next();
    } catch (err) {
      console.error("❌ Socket auth error:", err.message);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(
      `🔌 User ${socket.username} (${socket.userId}) connected with socket ID: ${socket.id}`
    );

    // Add user to connected users
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      userId: socket.userId,
      username: socket.username,
      status: "online",
    });

    // Broadcast online users to all clients
    const onlineUsersList = Array.from(connectedUsers.values());
    console.log(`👥 Broadcasting ${onlineUsersList.length} online users`);
    io.emit("users_online", onlineUsersList);

    // Join user to their personal room for direct messaging
    socket.join(`user_${socket.userId}`);
    console.log(
      `🏠 User ${socket.username} joined room: user_${socket.userId}`
    );

    // Handle private messages
    socket.on("send_message", async (data) => {
      try {
        console.log("📨 Received send_message:", {
          from: socket.username,
          to: data.recipient,
          content: data.content.substring(0, 50) + "...",
          tempId: data.tempId,
        });

        // Validate required fields
        if (!data.recipient || !data.content || !data.tempId) {
          throw new Error(
            "Missing required fields: recipient, content, or tempId"
          );
        }

        // Create and save message
        const message = new Message({
          sender: socket.userId,
          recipient: data.recipient,
          content: data.content.trim(),
          timestamp: new Date(),
          status: "sent",
        });

        await message.save();
        console.log("💾 Message saved with ID:", message._id);

        // Populate sender and recipient data
        await message.populate([
          { path: "sender", select: "username" },
          { path: "recipient", select: "username" },
        ]);

        // Create standardized message object
        const messageData = {
          _id: message._id,
          sender: {
            _id: message.sender._id,
            username: message.sender.username,
          },
          recipient: {
            _id: message.recipient._id,
            username: message.recipient.username,
          },
          content: message.content,
          timestamp: message.timestamp,
          status: "delivered",
        };

        // Send to recipient if they're online
        const recipientSocket = connectedUsers.get(data.recipient);
        if (recipientSocket) {
          console.log(
            `📤 Sending message to recipient ${data.recipient} in room user_${data.recipient}`
          );
          io.to(`user_${data.recipient}`).emit("message_received", messageData);

          // Mark as delivered
          messageData.status = "delivered";
          setTimeout(() => {
            socket.emit("message_delivered", { messageId: message._id });
          }, 100);
        } else {
          console.log(`📵 Recipient ${data.recipient} is offline`);
        }

        // Send confirmation back to sender
        socket.emit("message_sent", {
          tempId: data.tempId,
          message: messageData,
        });

        console.log("✅ Message processing completed successfully");
      } catch (error) {
        console.error("❌ Send message error:", error.message);
        socket.emit("message_error", {
          error: error.message || "Failed to send message",
          tempId: data.tempId,
        });
      }
    });

    // Handle typing indicators
    socket.on("typing", (data) => {
      if (!data.recipient) {
        console.error("❌ Typing event missing recipient");
        return;
      }

      console.log(`⌨️ ${socket.username} is typing to user ${data.recipient}`);

      // Send typing indicator to specific recipient
      io.to(`user_${data.recipient}`).emit("user_typing", {
        userId: socket.userId,
        username: socket.username,
      });
    });

    socket.on("stop_typing", (data) => {
      if (!data.recipient) {
        console.error("❌ Stop typing event missing recipient");
        return;
      }

      console.log(
        `⏹️ ${socket.username} stopped typing to user ${data.recipient}`
      );

      // Send stop typing indicator to specific recipient
      io.to(`user_${data.recipient}`).emit("user_stop_typing", {
        userId: socket.userId,
      });
    });

    // Handle marking messages as read
    socket.on("mark_message_read", async (data) => {
      try {
        if (!data.messageId) {
          console.error("❌ Mark read event missing messageId");
          return;
        }

        console.log(
          `👁️ Marking message ${data.messageId} as read by ${socket.username}`
        );

        // Update message status in database
        await Message.findByIdAndUpdate(data.messageId, {
          status: "read",
          readAt: new Date(),
        });

        // Notify sender that message was read
        const message = await Message.findById(data.messageId).populate(
          "sender"
        );
        if (message && message.sender) {
          const senderSocket = connectedUsers.get(
            message.sender._id.toString()
          );
          if (senderSocket) {
            io.to(`user_${message.sender._id}`).emit("message_read", {
              messageId: data.messageId,
              readBy: socket.userId,
            });
          }
        }
      } catch (error) {
        console.error("❌ Mark message read error:", error.message);
      }
    });

    // Handle test connection (for debugging)
    socket.on("test_connection", (data) => {
      console.log("🧪 Test connection received:", data);
      socket.emit("test_response", {
        message: "Hello from backend",
        timestamp: new Date(),
        userId: socket.userId,
      });
    });

    // Handle disconnect
    socket.on("disconnect", (reason) => {
      console.log(`🔌 User ${socket.username} disconnected. Reason: ${reason}`);

      // Remove user from connected users
      connectedUsers.delete(socket.userId);

      // Broadcast updated online users list
      const onlineUsersList = Array.from(connectedUsers.values());
      console.log(
        `👥 Broadcasting ${onlineUsersList.length} online users after disconnect`
      );
      io.emit("users_online", onlineUsersList);
    });

    // Error handling
    socket.on("error", (error) => {
      console.error(`❌ Socket error for user ${socket.username}:`, error);
    });
  });

  // Global error handling
  io.on("error", (error) => {
    console.error("❌ Socket.IO server error:", error);
  });

  console.log("✅ Socket.IO server initialized successfully");
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

// Get connected users (useful for API endpoints)
const getConnectedUsers = () => {
  return Array.from(connectedUsers.values());
};

// Check if user is online
const isUserOnline = (userId) => {
  return connectedUsers.has(userId);
};

// Send notification to specific user
const sendNotificationToUser = (userId, notification) => {
  if (io && connectedUsers.has(userId)) {
    io.to(`user_${userId}`).emit("notification", notification);
    return true;
  }
  return false;
};

module.exports = {
  initializeSocket,
  getIO,
  getConnectedUsers,
  isUserOnline,
  sendNotificationToUser,
};
