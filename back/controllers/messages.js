const messageRouter = require("express").Router();
const Message = require("../models/message");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

const getTokenFrom = (request) => {
  const authorization = request.get("authorization");
  if (authorization && authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.substring(7);
  }
  return null;
};

// Get conversations for user
messageRouter.get("/conversations", async (request, response) => {
  const token = getTokenFrom(request);

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET);
    if (!decodedToken.id) {
      return response.status(401).json({ error: "token missing or invalid" });
    }

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: decodedToken.id }, { recipient: decodedToken.id }],
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", decodedToken.id] },
              "$recipient",
              "$sender",
            ],
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$recipient", decodedToken.id] },
                    { $eq: ["$read", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    await Message.populate(conversations, {
      path: "_id lastMessage.sender lastMessage.recipient",
      select: "username",
    });

    response.json(conversations);
  } catch (error) {
    console.error("Get conversations error:", error);
    response.status(500).json({ error: "Failed to get conversations" });
  }
});

// Get messages between two users
messageRouter.get("/conversation/:userId", async (request, response) => {
  const token = getTokenFrom(request);

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET);
    if (!decodedToken.id) {
      return response.status(401).json({ error: "token missing or invalid" });
    }

    const messages = await Message.find({
      $or: [
        { sender: decodedToken.id, recipient: request.params.userId },
        { sender: request.params.userId, recipient: decodedToken.id },
      ],
    })
      .populate("sender", "username")
      .populate("recipient", "username")
      .sort({ timestamp: 1 });

    response.json(messages);
  } catch (error) {
    console.error("Get messages error:", error);
    response.status(500).json({ error: "Failed to get messages" });
  }
});

// Mark messages as read
messageRouter.put("/mark-read/:userId", async (request, response) => {
  const token = getTokenFrom(request);

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET);
    if (!decodedToken.id) {
      return response.status(401).json({ error: "token missing or invalid" });
    }

    await Message.updateMany(
      {
        sender: request.params.userId,
        recipient: decodedToken.id,
        read: false,
      },
      { read: true }
    );

    response.json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Mark as read error:", error);
    response.status(500).json({ error: "Failed to mark as read" });
  }
});

module.exports = messageRouter;
