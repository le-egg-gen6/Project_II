const reactionRouter = require("express").Router();
const BlogReaction = require("../models/reaction");
const Blog = require("../models/blog");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { createNotification } = require("./notifications");

const getTokenFrom = (request) => {
  const authorization = request.get("authorization");
  if (authorization && authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.substring(7);
  }
  return null;
};

// Add or update reaction
reactionRouter.post("/:blogId", async (request, response) => {
  const token = getTokenFrom(request);
  const decodedToken = jwt.verify(token, process.env.SECRET);

  if (!decodedToken.id) {
    return response.status(401).json({ error: "token missing or invalid" });
  }

  const { type } = request.body;
  const blogId = request.params.blogId;
  const userId = decodedToken.id;

  try {
    const blog = await Blog.findById(blogId).populate("user", "username name");
    if (!blog) {
      return response.status(404).json({ error: "Blog not found" });
    }

    let blogReaction = await BlogReaction.findOne({ blog: blogId });

    if (!blogReaction) {
      blogReaction = new BlogReaction({
        blog: blogId,
        reactions: [],
      });
    }

    // Check if user already reacted
    const existingReactionIndex = blogReaction.reactions.findIndex(
      (r) => r.user.toString() === userId
    );
    const isNewReaction = existingReactionIndex === -1;

    if (existingReactionIndex !== -1) {
      // Update existing reaction
      blogReaction.reactions[existingReactionIndex].type = type;
    } else {
      // Add new reaction
      blogReaction.reactions.push({
        user: userId,
        type: type,
      });
    }

    await blogReaction.save();
    await blogReaction.populate("reactions.user", "username");

    // Create notification for blog owner (if not reacting to own post and it's a new reaction)
    if (blog.user._id.toString() !== userId && isNewReaction) {
      const user = await User.findById(userId);
      const reactionEmoji =
        type === "like"
          ? "👍"
          : type === "love"
          ? "❤️"
          : type === "laugh"
          ? "😂"
          : type === "wow"
          ? "😮"
          : type === "sad"
          ? "😢"
          : type === "angry"
          ? "😠"
          : "👍";

      await createNotification({
        recipient: blog.user._id,
        fromUser: userId,
        type: "reaction",
        message: `reacted ${reactionEmoji} to your post: "${blog.title}"`,
        post: blog._id,
      });
    }

    response.json(blogReaction);
  } catch (error) {
    console.error("Reaction error:", error);
    response.status(500).json({ error: "Failed to add reaction" });
  }
});

// Remove reaction
reactionRouter.delete("/:blogId", async (request, response) => {
  const token = getTokenFrom(request);
  const decodedToken = jwt.verify(token, process.env.SECRET);

  if (!decodedToken.id) {
    return response.status(401).json({ error: "token missing or invalid" });
  }

  const blogId = request.params.blogId;
  const userId = decodedToken.id;

  try {
    const blogReaction = await BlogReaction.findOne({ blog: blogId });

    if (blogReaction) {
      blogReaction.reactions = blogReaction.reactions.filter(
        (r) => r.user.toString() !== userId
      );
      await blogReaction.save();
    }

    response.json({ message: "Reaction removed" });
  } catch (error) {
    response.status(500).json({ error: "Failed to remove reaction" });
  }
});

// Get reactions for a blog
reactionRouter.get("/:blogId", async (request, response) => {
  try {
    const blogReaction = await BlogReaction.findOne({
      blog: request.params.blogId,
    }).populate("reactions.user", "username");

    response.json(
      blogReaction || { blog: request.params.blogId, reactions: [] }
    );
  } catch (error) {
    response.status(500).json({ error: "Failed to fetch reactions" });
  }
});

module.exports = reactionRouter;
