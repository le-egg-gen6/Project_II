const notificationRouter = require("express").Router();
const Notification = require("../models/notification");
const jwt = require("jsonwebtoken");

const getTokenFrom = (request) => {
  const authorization = request.get("authorization");
  if (authorization && authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.substring(7);
  }
  return null;
};

// Get all notifications for user
notificationRouter.get("/", async (request, response) => {
  const token = getTokenFrom(request);

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET);
    if (!decodedToken.id) {
      return response.status(401).json({ error: "token missing or invalid" });
    }

    const notifications = await Notification.find({
      recipient: decodedToken.id,
    })
      .populate("fromUser", "username name")
      .populate("post", "title")
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(
      `Found ${notifications.length} notifications for user ${decodedToken.id}`
    );
    response.json(notifications);
  } catch (error) {
    console.error("Notification fetch error:", error);
    response.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Mark notification as read
notificationRouter.put("/:id/read", async (request, response) => {
  const token = getTokenFrom(request);

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET);
    if (!decodedToken.id) {
      return response.status(401).json({ error: "token missing or invalid" });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: request.params.id, recipient: decodedToken.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return response.status(404).json({ error: "Notification not found" });
    }

    response.json(notification);
  } catch (error) {
    console.error("Mark as read error:", error);
    response.status(500).json({ error: "Failed to mark as read" });
  }
});

// Mark all notifications as read
notificationRouter.put("/mark-all-read", async (request, response) => {
  const token = getTokenFrom(request);

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET);
    if (!decodedToken.id) {
      return response.status(401).json({ error: "token missing or invalid" });
    }

    await Notification.updateMany(
      { recipient: decodedToken.id, read: false },
      { read: true }
    );

    response.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all as read error:", error);
    response.status(500).json({ error: "Failed to mark all as read" });
  }
});

// Delete notification
notificationRouter.delete("/:id", async (request, response) => {
  const token = getTokenFrom(request);

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET);
    if (!decodedToken.id) {
      return response.status(401).json({ error: "token missing or invalid" });
    }

    const notification = await Notification.findOneAndDelete({
      _id: request.params.id,
      recipient: decodedToken.id,
    });

    if (!notification) {
      return response.status(404).json({ error: "Notification not found" });
    }

    response.status(204).end();
  } catch (error) {
    console.error("Delete notification error:", error);
    response.status(500).json({ error: "Failed to delete notification" });
  }
});

// Create notification (internal use)
const createNotification = async (data) => {
  try {
    console.log("Creating notification:", data);
    const notification = new Notification(data);
    await notification.save();
    console.log("Notification created successfully:", notification.id);
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    throw error;
  }
};

module.exports = { notificationRouter, createNotification };
