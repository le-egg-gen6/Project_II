"use client";

import { useState } from "react";
import { createBlog } from "../reducers/blogReducer";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setNotification } from "../reducers/notificationReducer";
import { TextInput, Label } from "flowbite-react";
import BlogFooter from "./BlogFooter";
import CategoryTagSystem from "./CategoryTagSystem";
import UserMentions from "./UserMentions";
import FileUpload from "./FileUpload";
import { Save, Eye, ArrowLeft } from "lucide-react";

const NewBlog = () => {
  const dispatch = useDispatch();
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const addBlog = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    if (!newTitle.trim()) {
      const notif = {
        message: "Please enter a title for your post",
        type: "error",
      };
      dispatch(setNotification(notif, 2500));
      return;
    }

    if (!newContent.trim()) {
      const notif = {
        message: "Please enter content for your post",
        type: "error",
      };
      dispatch(setNotification(notif, 2500));
      return;
    }

    if (!selectedCategory) {
      const notif = {
        message: "Please select a category for your post",
        type: "error",
      };
      dispatch(setNotification(notif, 2500));
      return;
    }

    setIsSubmitting(true);

    const blogObject = {
      title: newTitle.trim(),
      content: newContent.trim(),
      dateCreated: new Date(),
      category: selectedCategory,
      tags: selectedTags,
      attachments: attachedFiles,
    };

    try {
      await dispatch(createBlog(blogObject));
      const notif1 = {
        message: `Post "${newTitle}" published successfully!`,
        type: "success",
      };
      dispatch(setNotification(notif1, 3000));
      navigate("/");
    } catch (exception) {
      console.error("Error creating blog:", exception);
      const notif2 = {
        message: `Failed to publish post: ${
          exception.message || "Unknown error"
        }`,
        type: "error",
      };
      dispatch(setNotification(notif2, 3000));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (uploadedFiles) => {
    setAttachedFiles((prev) => [...prev, ...uploadedFiles]);
  };

  const removeAttachment = (index) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getCategoryColor = (category) => {
    const colors = {
      technology:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      science:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      programming:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      design: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      business:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      entertainment:
        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      sports:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      health: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
      education:
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      other: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <main className="pt-8 pb-16 lg:pt-16 lg:pb-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            {/* Header */}
            <div className="p-8 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 transition-colors duration-300">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-300"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Create New Post
                  </h1>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-300"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{showPreview ? "Edit" : "Preview"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              {!showPreview ? (
                <form onSubmit={addBlog} className="space-y-8">
                  {/* Title */}
                  <div>
                    <Label
                      htmlFor="post-title"
                      value="Title"
                      className="text-lg font-medium mb-3 block text-gray-900 dark:text-white transition-colors duration-300"
                    />
                    <TextInput
                      id="post-title"
                      type="text"
                      placeholder="Write an engaging title..."
                      required={true}
                      value={newTitle}
                      onChange={({ target }) => setNewTitle(target.value)}
                      className="text-lg"
                      size="lg"
                    />
                  </div>

                  {/* Category and Tags */}
                  <CategoryTagSystem
                    selectedCategory={selectedCategory}
                    selectedTags={selectedTags}
                    onCategoryChange={setSelectedCategory}
                    onTagsChange={setSelectedTags}
                    mode="create"
                  />

                  {/* Content */}
                  <div>
                    <Label
                      htmlFor="post-content"
                      value="Content"
                      className="text-lg font-medium mb-3 block text-gray-900 dark:text-white transition-colors duration-300"
                    />
                    <UserMentions
                      value={newContent}
                      onChange={setNewContent}
                      placeholder="Share your thoughts... Use @ to mention someone"
                      rows={8}
                    />
                  </div>

                  {/* File Upload */}
                  <div>
                    <Label
                      value="Attachments (Optional)"
                      className="text-lg font-medium mb-3 block text-gray-900 dark:text-white transition-colors duration-300"
                    />
                    <FileUpload onFileUpload={handleFileUpload} />

                    {/* Attached Files */}
                    {attachedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Attached Files:
                        </h4>
                        <div className="space-y-2">
                          {attachedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                  <span className="text-xs font-medium text-blue-600 dark:text-blue-300">
                                    {file.name.split(".").pop()?.toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeAttachment(index)}
                                className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => navigate("/")}
                      className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center space-x-2 px-8 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      <span>
                        {isSubmitting ? "Publishing..." : "Publish Post"}
                      </span>
                    </button>
                  </div>
                </form>
              ) : (
                // Preview Mode
                <div className="space-y-6">
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedCategory && (
                        <span
                          className={`px-3 py-1 text-sm font-medium rounded-full ${getCategoryColor(
                            selectedCategory
                          )}`}
                        >
                          {selectedCategory}
                        </span>
                      )}
                      {selectedTags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                      {newTitle || "Untitled Post"}
                    </h2>
                  </div>
                  <div className="prose prose-lg dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                      {newContent || "No content yet..."}
                    </div>
                  </div>
                  {attachedFiles.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                        Attachments:
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {attachedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="p-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <BlogFooter />
    </div>
  );
};

export default NewBlog;
