"use client";

import { useSelector, useDispatch } from "react-redux";
import { setNotification } from "../reducers/notificationReducer";
import { updateBlog, deleteBlog } from "../reducers/blogReducer";
import { Card, Badge } from "flowbite-react";
import CommentIcon from "@mui/icons-material/Comment";
import ReactionSystem from "./ReactionSystem";
import { Hash, Calendar, User } from "lucide-react";

const Blog = ({ blog, viewMode = "grid" }) => {
  const user = useSelector((state) => state.users);
  const dispatch = useDispatch();
  const blogs = useSelector((state) => state.blogs);

  if (blog === undefined) {
    return null;
  }

  const comments = blog.comments ? blog.comments : [];

  const handleUpdateBlog = async (blogObject) => {
    try {
      await dispatch(updateBlog(blogObject));
    } catch (error) {
      const notif = {
        message: error.response.data.error,
        type: "error",
      };
      dispatch(setNotification(notif, 2500));
    }
  };

  const handleDeleteBlog = async (id) => {
    const blog1 = blogs.filter((b) => b.id === id);
    const title = blog1[0].title;
    if (window.confirm(`Do you want to delete ${title}?`)) {
      try {
        await dispatch(deleteBlog(id));
        const notif = {
          message: "Successfully deleted",
          type: "success",
        };
        dispatch(setNotification(notif, 2500));
      } catch (error) {
        const notif = {
          message: error.message,
          type: "error",
        };
        dispatch(setNotification(notif, 2500));
      }
    }
  };

  var summary = blog.content.substring(0, 130);
  summary =
    summary.length === 130
      ? summary.substr(0, Math.min(summary.length, summary.lastIndexOf(" ")))
      : summary;

  const getCategoryColor = (category) => {
    const colors = {
      technology: "blue",
      science: "green",
      programming: "purple",
      design: "pink",
      business: "yellow",
      entertainment: "red",
      sports: "orange",
      health: "teal",
      education: "indigo",
      other: "gray",
    };
    return colors[category] || "gray";
  };

  if (viewMode === "list") {
    return (
      <Card className="mb-4 hover:shadow-lg transition-shadow">
        <div className="flex items-start space-x-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              {blog.category && (
                <Badge
                  size="sm"
                  className="font-medium text-gray-900 dark:text-white"
                >
                  {blog.category}
                </Badge>
              )}
              {blog.tags?.slice(0, 3).map((tag) => (
                <Badge key={tag} color="gray" size="sm">
                  <Hash className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
            <a href={`/posts/${blog.id}`} className="block">
              <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white hover:text-blue-600 transition-colors">
                {blog.title}
              </h5>
              <p className="font-normal text-gray-700 dark:text-gray-400 mt-2">
                {summary}
              </p>
            </a>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  <span>u/{blog.user?.username}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>{new Date(blog.dateCreated).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <ReactionSystem blogId={blog.id} compact={true} />
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <CommentIcon className="w-4 h-4 mr-1" />
                  <span>{comments.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="mb-4 hover:shadow-lg transition-shadow"
      href={`/posts/${blog.id}`}
    >
      <div className="flex items-center space-x-2 mb-3">
        {blog.category && (
          <Badge
            size="sm"
            className="font-medium text-gray-900 dark:text-white"
          >
            {blog.category}
          </Badge>
        )}
        {blog.tags?.slice(0, 2).map((tag) => (
          <Badge key={tag} color="gray" size="sm">
            <Hash className="w-3 h-3 mr-1" />
            {tag}
          </Badge>
        ))}
      </div>
      <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        {blog.title}
      </h5>
      <p className="font-normal text-gray-700 dark:text-gray-400">{summary}</p>
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-3 text-sm text-gray-500">
          <span>u/{blog.user?.username}</span>
          <span>{new Date(blog.dateCreated).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center space-x-4">
          <ReactionSystem blogId={blog.id} compact={true} />
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <CommentIcon className="w-4 h-4 mr-1" />
            <span>{comments.length}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default Blog;
