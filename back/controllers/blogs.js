const blogRouter = require("express").Router();
const Blog = require("../models/blog");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { createNotification } = require("./notifications");

blogRouter.get("/", async (request, response) => {
  const blogs = await Blog.find({}).populate("user", { username: 1, name: 1 });
  response.json(blogs);
});

blogRouter.get("/:id", async (request, response) => {
  const blog = await Blog.findById(request.params.id);
  if (blog) {
    response.json(blog.toJSON());
  } else {
    response.status(404).end();
  }
});

const getTokenFrom = (request) => {
  const authorization = request.get("authorization");
  if (authorization && authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.substring(7);
  }
  return null;
};

blogRouter.post("/", async (request, response, next) => {
  const body = request.body;
  const token = getTokenFrom(request);
  const decodedToken = jwt.verify(token, process.env.SECRET);
  if (!decodedToken.id) {
    return response.status(401).json({ error: "token missing or invalid" });
  }
  if (!body.likes) {
    body.likes = 0;
  }
  if (!body.comments) {
    body.comments = [];
  }
  if (!body.title) {
    return response.status(400).json({
      error: "title is required",
    });
  }

  const user = await User.findById(decodedToken.id);

  const blog = new Blog({
    title: body.title,
    content: body.content,
    dateCreated: body.dateCreated,
    likes: body.likes,
    comments: body.comments,
    user: user._id,
    category: body.category,
    tags: body.tags || [],
  });

  try {
    const savedBlog = await blog.save();
    user.blogs = user.blogs.concat(savedBlog._id);
    await user.save();

    // Check for mentions in the blog content
    const mentionRegex = /@(\w+)/g;
    const mentions = body.content.match(mentionRegex);

    if (mentions) {
      for (const mention of mentions) {
        const username = mention.substring(1); // Remove @
        const mentionedUser = await User.findOne({ username });

        if (
          mentionedUser &&
          mentionedUser._id.toString() !== user._id.toString()
        ) {
          await createNotification({
            recipient: mentionedUser._id,
            fromUser: user._id,
            type: "mention",
            message: `mentioned you in a post: "${body.title}"`,
            post: savedBlog._id,
          });
        }
      }
    }

    response.status(201).json(savedBlog);
  } catch (exception) {
    next(exception);
  }
});

blogRouter.delete("/:id", async (request, response, next) => {
  const token = getTokenFrom(request);
  const decodedToken = jwt.verify(token, process.env.SECRET);
  if (!decodedToken.id) {
    return response.status(401).json({ error: "token missing or invalid" });
  }

  const user = await User.findById(decodedToken.id);
  const blogToDelete = await Blog.findById(request.params.id);

  if (user._id.toString() != blogToDelete.user._id.toString()) {
    return response.status(401).json({ error: `Unauthorized` });
  }

  try {
    await Blog.findByIdAndDelete(request.params.id);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

blogRouter.put("/:id", async (request, response, next) => {
  const body = request.body;
  const token = getTokenFrom(request);
  const decodedToken = jwt.verify(token, process.env.SECRET);
  if (!decodedToken.id) {
    return response.status(401).json({ error: "token missing or invalid" });
  }
  if (!body.likes) {
    body.likes = 0;
  }
  if (!body.title) {
    return response.status(400).json({
      error: "title is required",
    });
  }

  const blog = {
    title: body.title,
    content: body.content,
    dateCreated: body.dateCreated,
    likes: body.likes,
    comments: body.comments,
    category: body.category,
    tags: body.tags || [],
  };

  try {
    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, {
      new: true,
    });
    response.json(updatedBlog.toJSON());
  } catch (exception) {
    next(exception);
  }
});

blogRouter.post("/:id/comments", async (request, response) => {
  const body = request.body;
  const blog = await Blog.findById(request.params.id).populate("user", {
    username: 1,
    name: 1,
  });
  const token = getTokenFrom(request);
  const decodedToken = jwt.verify(token, process.env.SECRET);
  if (!decodedToken.id) {
    return response.status(401).json({ error: "token missing or invalid" });
  }

  const user = await User.findById(decodedToken.id);
  const comment = {
    content: body.content,
    user: user._id,
    dateCreated: new Date(),
  };

  blog.comments = blog.comments.concat(comment);
  const updatedBlog = await blog.save();

  // Create notification for blog owner (if not commenting on own post)
  if (blog.user._id.toString() !== user._id.toString()) {
    await createNotification({
      recipient: blog.user._id,
      fromUser: user._id,
      type: "comment",
      message: `commented on your post: "${blog.title}"`,
      post: blog._id,
    });
  }

  // Check for mentions in the comment
  const mentionRegex = /@(\w+)/g;
  const mentions = body.content.match(mentionRegex);

  if (mentions) {
    for (const mention of mentions) {
      const username = mention.substring(1); // Remove @
      const mentionedUser = await User.findOne({ username });

      if (
        mentionedUser &&
        mentionedUser._id.toString() !== user._id.toString() &&
        mentionedUser._id.toString() !== blog.user._id.toString()
      ) {
        await createNotification({
          recipient: mentionedUser._id,
          fromUser: user._id,
          type: "mention",
          message: `mentioned you in a comment on "${blog.title}"`,
          post: blog._id,
        });
      }
    }
  }

  updatedBlog
    ? response.status(200).json(updatedBlog.toJSON())
    : response.status(404).end();
});

module.exports = blogRouter;
