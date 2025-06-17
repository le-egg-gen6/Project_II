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
        return next(new Error("No token provided"));
      }

      const decodedToken = jwt.verify(token, process.env.SECRET);
      const user = await User.findById(decodedToken.id);

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.userId = user._id.toString();
      socket.username = user.username;
      next();
    } catch (err) {
      console.error("Socket auth error:", err);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User ${socket.username} connected`);

    // Add user to connected users
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      userId: socket.userId,
      username: socket.username,
      status: "online",
    });

    // Broadcast online users
    io.emit("users_online", Array.from(connectedUsers.values()));

    // Join user to their personal room for notifications
    socket.join(`user_${socket.userId}`);

    // Handle private messages
    socket.on("send_message", async (data) => {
      try {
        const message = new Message({
          sender: socket.userId,
          recipient: data.recipient,
          content: data.content,
          timestamp: new Date(),
        });

        await message.save();
        await message.populate("sender", "username");

        // Send to recipient if online
        const recipientSocket = connectedUsers.get(data.recipient);
        if (recipientSocket) {
          io.to(`user_${data.recipient}`).emit("receive_message", {
            id: message._id,
            sender: message.sender,
            content: message.content,
            timestamp: message.timestamp,
          });
        }

        // Send confirmation back to sender
        socket.emit("message_sent", {
          id: message._id,
          recipient: data.recipient,
          content: message.content,
          timestamp: message.timestamp,
        });
      } catch (error) {
        console.error("Send message error:", error);
        socket.emit("message_error", { error: "Failed to send message" });
      }
    });

    // Handle typing indicators
    socket.on("typing", (data) => {
      socket.to(`user_${data.recipient}`).emit("user_typing", {
        userId: socket.userId,
        username: socket.username,
      });
    });

    socket.on("stop_typing", (data) => {
      socket.to(`user_${data.recipient}`).emit("user_stop_typing", {
        userId: socket.userId,
      });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User ${socket.username} disconnected`);
      connectedUsers.delete(socket.userId);
      io.emit("users_online", Array.from(connectedUsers.values()));
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = { initializeSocket, getIO };
