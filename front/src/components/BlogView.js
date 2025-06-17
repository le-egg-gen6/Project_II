"use client";

import { Spinner, Button, Badge } from "flowbite-react";
import { useSelector, useDispatch } from "react-redux";
import {
  Edit,
  Trash2,
  Calendar,
  User,
  Hash,
  MessageSquare,
} from "lucide-react";
import { setNotification } from "../reducers/notificationReducer";
import { deleteBlog, commentBlog } from "../reducers/blogReducer";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BlogFooter from "./BlogFooter";
import Comment from "./Comment";
import ReactionSystem from "./ReactionSystem";
import UserMentions from "./UserMentions";

const BlogView = ({ blog }) => {
  const user = useSelector((state) => state.users);
  const allUsers = useSelector((state) => state.allUsers);
  const [newComment, setNewComment] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  if (blog === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Spinner size="xl" />
      </div>
    );
  }

  const comments = blog.comments || [];
  const blogUser = blog.user?.username
    ? blog.user
    : allUsers.find((u) => u.id === blog.user);

  const handleDeleteBlog = async (id) => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await dispatch(deleteBlog(id));
        const notif = {
          message: "Post deleted successfully",
          type: "success",
        };
        dispatch(setNotification(notif, 2500));
        navigate("/");
      } catch (error) {
        const notif = {
          message: error.message || "Failed to delete post",
          type: "error",
        };
        dispatch(setNotification(notif, 2500));
      }
    }
  };

  const commentFormSubmit = (event) => {
    event.preventDefault();
    if (!newComment.trim()) return;

    handleComment(newComment, blog.id);
    setNewComment("");
  };

  const handleComment = async (comment, id) => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      await dispatch(commentBlog(comment, id));
      const notif1 = {
        message: "Comment added successfully",
        type: "success",
      };
      dispatch(setNotification(notif1, 2500));
    } catch (error) {
      const notif2 = {
        message: error.message || "Failed to add comment",
        type: "error",
      };
      dispatch(setNotification(notif2, 2500));
    }
  };

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

  const canEditDelete =
    user && (user.id === blog.user?.id || user.id === blog.user);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="pt-8 pb-16 lg:pt-16 lg:pb-24">
        <div className="max-w-4xl mx-auto px-4">
          <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <header className="p-8 border-b border-gray-200 dark:border-gray-700">
              {/* Category and Tags */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {blog.category && (
                  <Badge
                    color={getCategoryColor(blog.category)}
                    size="sm"
                    className="font-medium"
                  >
                    {blog.category.charAt(0).toUpperCase() +
                      blog.category.slice(1)}
                  </Badge>
                )}
                {blog.tags?.map((tag) => (
                  <Badge
                    key={tag}
                    color="gray"
                    size="sm"
                    className="font-normal"
                  >
                    <Hash className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Title */}
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                {blog.title}
              </h1>

              {/* Author and Meta Info */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-gray-500" />
                    <a
                      href={`/users/${blogUser?.username}`}
                      className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      u/{blogUser?.username || "Unknown"}
                    </a>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(blog.dateCreated).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                {canEditDelete && (
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      color="gray"
                      href={`/posts/edit/${blog.id}`}
                      className="rounded-lg"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      color="failure"
                      onClick={() => handleDeleteBlog(blog.id)}
                      className="rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </header>

            {/* Content */}
            <div className="p-8">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {blog.content}
                </div>
              </div>

              {/* Attachments */}
              {blog.attachments && blog.attachments.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Attachments
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {blog.attachments.map((file, index) => (
                      <a
                        key={index}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Reactions and Stats */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <ReactionSystem blogId={blog.id} />
                <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="w-4 h-4" />
                    <span>
                      {comments.length}{" "}
                      {comments.length === 1 ? "comment" : "comments"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <section className="border-t border-gray-200 dark:border-gray-700">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Discussion ({comments.length})
                  </h2>
                </div>

                {/* Comment Form */}
                {user ? (
                  <form onSubmit={commentFormSubmit} className="mb-8">
                    <div className="mb-4">
                      <UserMentions
                        value={newComment}
                        onChange={setNewComment}
                        placeholder="Share your thoughts... Use @ to mention someone"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Post Comment
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-xl text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Join the discussion! Sign in to leave a comment.
                    </p>
                    <Button href="/login" color="blue" className="rounded-lg">
                      Sign In
                    </Button>
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-6">
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <Comment key={comment.id} comment={comment} />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No comments yet
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Be the first to share your thoughts!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </article>
        </div>
      </main>

      <BlogFooter />
    </div>
  );
};

export default BlogView;
