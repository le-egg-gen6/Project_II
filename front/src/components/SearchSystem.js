"use client";

import axios from "axios";
import { Badge, Spinner } from "flowbite-react";
import {
  Clock,
  FileText,
  Filter,
  Hash,
  Heart,
  MessageCircle,
  MessageSquare,
  Search,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const SearchSystem = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({
    posts: [],
    users: [],
    comments: [],
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [filters, setFilters] = useState({
    category: "",
    tags: [],
    dateRange: "",
    sortBy: "relevance",
  });
  const [categories] = useState([
    "technology",
    "science",
    "programming",
    "design",
    "business",
    "entertainment",
    "sports",
    "health",
    "education",
    "other",
  ]);

  const user = useSelector((state) => state.users);

  useEffect(() => {
    if (searchQuery.length > 2) {
      const debounceTimer = setTimeout(() => {
        performSearch();
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setSearchResults({ posts: [], users: [], comments: [] });
    }
  }, [searchQuery, filters]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        category: filters.category,
        tags: filters.tags.join(","),
        dateRange: filters.dateRange,
        sortBy: filters.sortBy,
      });

      const response = await axios.get(`/api/search?${params}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    return text.replace(
      regex,
      "<mark class='bg-yellow-200 dark:bg-yellow-600 px-1 rounded'>$1</mark>"
    );
  };

  const getTotalResults = () => {
    return (
      searchResults.posts.length +
      searchResults.users.length +
      searchResults.comments.length
    );
  };

  const addTagFilter = (tag) => {
    if (!filters.tags.includes(tag)) {
      setFilters((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
    }
  };

  const removeTagFilter = (tag) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      category: "",
      tags: [],
      dateRange: "",
      sortBy: "relevance",
    });
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

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInHours = Math.floor((now - new Date(date)) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-4xl max-h-[85vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in slide-in-from-top-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-xl">
              <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Search Forum
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Find posts, users, and discussions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search posts, users, comments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filters:
              </span>
            </div>

            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, category: e.target.value }))
              }
              className="text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>

            {/* Sort By */}
            <select
              value={filters.sortBy}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, sortBy: e.target.value }))
              }
              className="text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="relevance">Most Relevant</option>
              <option value="date">Most Recent</option>
              <option value="likes">Most Liked</option>
              <option value="comments">Most Discussed</option>
            </select>

            {/* Date Range */}
            <select
              value={filters.dateRange}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, dateRange: e.target.value }))
              }
              className="text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Any Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>

            {/* Clear Filters */}
            {(filters.category ||
              filters.tags.length > 0 ||
              filters.dateRange ||
              filters.sortBy !== "relevance") && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Active Tag Filters */}
          {filters.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {filters.tags.map((tag) => (
                <Badge
                  key={tag}
                  color="blue"
                  className="flex items-center space-x-1 px-3 py-1"
                >
                  <Hash className="w-3 h-3" />
                  <span>{tag}</span>
                  <button
                    onClick={() => removeTagFilter(tag)}
                    className="ml-1 hover:bg-blue-600 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <Spinner size="xl" className="mb-4" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  Searching...
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Finding the best results for you
                </p>
              </div>
            </div>
          ) : searchQuery.length > 2 ? (
            <div className="p-6">
              {/* Results Summary */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-800 dark:text-blue-200 font-medium">
                      Found {getTotalResults()} results for "{searchQuery}"
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {searchResults.posts.length} posts,{" "}
                      {searchResults.users.length} users,{" "}
                      {searchResults.comments.length} comments
                    </p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                {[
                  {
                    key: "all",
                    label: "All",
                    count: getTotalResults(),
                    icon: Search,
                  },
                  {
                    key: "posts",
                    label: "Posts",
                    count: searchResults.posts.length,
                    icon: FileText,
                  },
                  {
                    key: "users",
                    label: "Users",
                    count: searchResults.users.length,
                    icon: User,
                  },
                  {
                    key: "comments",
                    label: "Comments",
                    count: searchResults.comments.length,
                    icon: MessageSquare,
                  },
                ].map(({ key, label, count, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
                      activeTab === key
                        ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-600/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                    {count > 0 && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          activeTab === key
                            ? "bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300"
                            : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Results Content */}
              <div className="space-y-6">
                {(activeTab === "all" || activeTab === "posts") &&
                  searchResults.posts.length > 0 && (
                    <div>
                      {activeTab === "all" && (
                        <h3 className="font-bold text-lg mb-4 flex items-center text-gray-900 dark:text-white">
                          <FileText className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                          Posts ({searchResults.posts.length})
                        </h3>
                      )}
                      <div className="space-y-4">
                        {(activeTab === "all"
                          ? searchResults.posts.slice(0, 3)
                          : searchResults.posts
                        ).map((post) => (
                          <div
                            key={post.id}
                            className="group p-6 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-200"
                          >
                            <Link to={`/posts/${post.id}`} className="block">
                              <div className="flex items-start justify-between mb-3">
                                <h4
                                  className="font-semibold text-lg text-blue-600 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300 line-clamp-2"
                                  dangerouslySetInnerHTML={{
                                    __html: highlightText(
                                      post.title,
                                      searchQuery
                                    ),
                                  }}
                                />
                                <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400 ml-4">
                                  <div className="flex items-center space-x-1">
                                    <Heart className="w-4 h-4" />
                                    <span>{post.likes}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <MessageCircle className="w-4 h-4" />
                                    <span>{post.comments?.length || 0}</span>
                                  </div>
                                </div>
                              </div>

                              <p
                                className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3"
                                dangerouslySetInnerHTML={{
                                  __html: highlightText(
                                    post.content.substring(0, 200) + "...",
                                    searchQuery
                                  ),
                                }}
                              />

                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                  <div className="flex items-center space-x-1">
                                    <User className="w-4 h-4" />
                                    <span>u/{post.user.username}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                      {formatTimeAgo(post.dateCreated)}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                  {post.category && (
                                    <Badge
                                      color={getCategoryColor(post.category)}
                                      size="sm"
                                    >
                                      {post.category}
                                    </Badge>
                                  )}
                                  {post.tags?.slice(0, 2).map((tag) => (
                                    <button
                                      key={tag}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        addTagFilter(tag);
                                      }}
                                      className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                                    >
                                      <Hash className="w-3 h-3 mr-1" />
                                      {tag}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {(activeTab === "all" || activeTab === "users") &&
                  searchResults.users.length > 0 && (
                    <div>
                      {activeTab === "all" && (
                        <h3 className="font-bold text-lg mb-4 flex items-center text-gray-900 dark:text-white">
                          <User className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                          Users ({searchResults.users.length})
                        </h3>
                      )}
                      <div
                        className={`grid gap-4 ${
                          activeTab === "users"
                            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                            : "grid-cols-1 md:grid-cols-2"
                        }`}
                      >
                        {(activeTab === "all"
                          ? searchResults.users.slice(0, 4)
                          : searchResults.users
                        ).map((user) => (
                          <div
                            key={user.id}
                            className="group p-6 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600 hover:shadow-lg transition-all duration-200"
                          >
                            <Link
                              to={`/users/${user.username}`}
                              className="block text-center"
                            >
                              <img
                                src={`https://ui-avatars.com/api/?name=${user.username}&background=random`}
                                alt={user.username}
                                className="w-16 h-16 rounded-full mx-auto mb-4 ring-4 ring-gray-100 dark:ring-gray-600 group-hover:ring-green-200 dark:group-hover:ring-green-800 transition-all"
                              />
                              <h4
                                className="font-semibold text-green-600 dark:text-green-400 group-hover:text-green-800 dark:group-hover:text-green-300 mb-2"
                                dangerouslySetInnerHTML={{
                                  __html: highlightText(
                                    user.username,
                                    searchQuery
                                  ),
                                }}
                              />
                              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                <p>{user.blogs?.length || 0} posts</p>
                                <p>Joined {formatTimeAgo(user.createdAt)}</p>
                              </div>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {(activeTab === "all" || activeTab === "comments") &&
                  searchResults.comments.length > 0 && (
                    <div>
                      {activeTab === "all" && (
                        <h3 className="font-bold text-lg mb-4 flex items-center text-gray-900 dark:text-white">
                          <MessageSquare className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                          Comments ({searchResults.comments.length})
                        </h3>
                      )}
                      <div className="space-y-4">
                        {(activeTab === "all"
                          ? searchResults.comments.slice(0, 3)
                          : searchResults.comments
                        ).map((comment) => (
                          <div
                            key={comment.id}
                            className="group p-6 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-lg transition-all duration-200"
                          >
                            <Link to={`/posts/${comment.blogId}`}>
                              <p
                                className="text-gray-700 dark:text-gray-300 mb-4"
                                dangerouslySetInnerHTML={{
                                  __html: highlightText(
                                    comment.content,
                                    searchQuery
                                  ),
                                }}
                              />
                              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center space-x-1">
                                    <User className="w-4 h-4" />
                                    <span>u/{comment.user.username}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                      {formatTimeAgo(comment.createdAt)}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-purple-600 dark:text-purple-400 font-medium">
                                  in "{comment.blogTitle}"
                                </span>
                              </div>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* No Results */}
                {getTotalResults() === 0 && !loading && (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No results found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Try adjusting your search terms or filters
                    </p>
                    <button
                      onClick={clearAllFilters}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mb-6">
                <Search className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Search the Forum
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                Type at least 3 characters to search for posts, users, and
                comments. Use filters to narrow down your results.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                  Try: "react"
                </span>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                  Try: "javascript"
                </span>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                  Try: "tutorial"
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchSystem;
