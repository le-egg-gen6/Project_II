const searchRouter = require("express").Router();
const Blog = require("../models/blog");
const User = require("../models/user");

searchRouter.get("/", async (request, response) => {
  try {
    const { q, category, tags, dateRange, sortBy } = request.query;

    if (!q || q.length < 3) {
      return response.json({ posts: [], users: [], comments: [] });
    }

    // Build search query
    const searchRegex = new RegExp(q, "i");
    let dateFilter = {};

    // Date range filter
    if (dateRange) {
      const now = new Date();
      switch (dateRange) {
        case "today":
          dateFilter = {
            dateCreated: { $gte: new Date(now.setHours(0, 0, 0, 0)) },
          };
          break;
        case "week":
          dateFilter = {
            dateCreated: { $gte: new Date(now.setDate(now.getDate() - 7)) },
          };
          break;
        case "month":
          dateFilter = {
            dateCreated: { $gte: new Date(now.setMonth(now.getMonth() - 1)) },
          };
          break;
        case "year":
          dateFilter = {
            dateCreated: {
              $gte: new Date(now.setFullYear(now.getFullYear() - 1)),
            },
          };
          break;
      }
    }

    // Search posts
    const postQuery = {
      $or: [{ title: searchRegex }, { content: searchRegex }],
      ...dateFilter,
    };

    if (category) {
      postQuery.category = category;
    }

    if (tags) {
      const tagArray = tags.split(",").filter((tag) => tag.trim());
      if (tagArray.length > 0) {
        postQuery.tags = { $in: tagArray };
      }
    }

    let postsQuery = Blog.find(postQuery).populate("user", "username");

    // Sort posts
    switch (sortBy) {
      case "date":
        postsQuery = postsQuery.sort({ dateCreated: -1 });
        break;
      case "likes":
        postsQuery = postsQuery.sort({ likes: -1 });
        break;
      case "comments":
        postsQuery = postsQuery.sort({ "comments.length": -1 });
        break;
      default:
        // Relevance - simple text score
        postsQuery = postsQuery.sort({ likes: -1, dateCreated: -1 });
    }

    const posts = await postsQuery.limit(50);

    // Search users
    const users = await User.find({
      username: searchRegex,
    })
      .populate("blogs", "title dateCreated likes")
      .limit(20);

    // Search comments
    const commentsResults = await Blog.aggregate([
      {
        $unwind: "$comments",
      },
      {
        $match: {
          "comments.content": searchRegex,
          ...dateFilter,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "comments.user",
          foreignField: "_id",
          as: "commentUser",
        },
      },
      {
        $project: {
          id: "$comments._id",
          content: "$comments.content",
          user: { $arrayElemAt: ["$commentUser", 0] },
          blogId: "$_id",
          blogTitle: "$title",
          createdAt: "$comments.createdAt",
        },
      },
      {
        $limit: 30,
      },
    ]);

    response.json({
      posts: posts.map((post) => ({
        id: post._id,
        title: post.title,
        content: post.content,
        user: post.user,
        dateCreated: post.dateCreated,
        likes: post.likes,
        comments: post.comments,
        category: post.category,
        tags: post.tags,
      })),
      users: users.map((user) => ({
        id: user._id,
        username: user.username,
        blogs: user.blogs,
        createdAt: user.createdAt,
      })),
      comments: commentsResults,
    });
  } catch (error) {
    console.error("Search error:", error);
    response.status(500).json({ error: "Search failed" });
  }
});

module.exports = searchRouter;
