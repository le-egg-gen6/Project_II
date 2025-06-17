"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Card, TextInput, Button, Badge, Tabs, Spinner } from "flowbite-react";
import {
  Search,
  User,
  FileText,
  MessageSquare,
  Tag,
  Filter,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";

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
    "Technology",
    "Science",
    "Programming",
    "Design",
    "Business",
    "Entertainment",
    "Sports",
    "Health",
    "Education",
    "Other",
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
      "<mark class='bg-yellow-200 dark:bg-yellow-600'>$1</mark>"
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Search className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold">Search Forum</h2>
          </div>
          <Button size="sm" color="gray" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <TextInput
              placeholder="Search posts, users, comments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 text-lg"
              size="lg"
              autoFocus
            />
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, category: e.target.value }))
              }
              className="text-sm border rounded-lg px-3 py-1"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Sort By */}
            <select
              value={filters.sortBy}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, sortBy: e.target.value }))
              }
              className="text-sm border rounded-lg px-3 py-1"
            >
              <option value="relevance">Relevance</option>
              <option value="date">Date</option>
              <option value="likes">Most Liked</option>
              <option value="comments">Most Commented</option>
            </select>

            {/* Date Range */}
            <select
              value={filters.dateRange}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, dateRange: e.target.value }))
              }
              className="text-sm border rounded-lg px-3 py-1"
            >
              <option value="">Any Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>

            {/* Active Tag Filters */}
            {filters.tags.map((tag) => (
              <Badge
                key={tag}
                color="blue"
                className="flex items-center space-x-1"
              >
                <Tag className="w-3 h-3" />
                <span>{tag}</span>
                <button onClick={() => removeTagFilter(tag)} className="ml-1">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Spinner size="lg" />
              <span className="ml-3">Searching...</span>
            </div>
          ) : searchQuery.length > 2 ? (
            <div className="p-6">
              {/* Results Summary */}
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-400">
                  Found {getTotalResults()} results for "{searchQuery}"
                </p>
              </div>

              {/* Tabs */}
              <Tabs.Group
                aria-label="Search results tabs"
                style="underline"
                onActiveTabChange={(tab) =>
                  setActiveTab(["all", "posts", "users", "comments"][tab])
                }
              >
                <Tabs.Item
                  active
                  title={`All (${getTotalResults()})`}
                  icon={Search}
                >
                  <div className="space-y-6">
                    {/* Posts */}
                    {searchResults.posts.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-lg mb-3 flex items-center">
                          <FileText className="w-5 h-5 mr-2" />
                          Posts ({searchResults.posts.length})
                        </h3>
                        <div className="space-y-3">
                          {searchResults.posts.slice(0, 3).map((post) => (
                            <Card
                              key={post.id}
                              className="hover:shadow-md transition-shadow"
                            >
                              <Link to={`/posts/${post.id}`} className="block">
                                <h4
                                  className="font-medium text-blue-600 hover:text-blue-800"
                                  dangerouslySetInnerHTML={{
                                    __html: highlightText(
                                      post.title,
                                      searchQuery
                                    ),
                                  }}
                                />
                                <p
                                  className="text-gray-600 mt-1 line-clamp-2"
                                  dangerouslySetInnerHTML={{
                                    __html: highlightText(
                                      post.content.substring(0, 150) + "...",
                                      searchQuery
                                    ),
                                  }}
                                />
                                <div className="flex items-center justify-between mt-3">
                                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <span>by {post.user.username}</span>
                                    <span>
                                      {new Date(
                                        post.dateCreated
                                      ).toLocaleDateString()}
                                    </span>
                                    <span>{post.likes} likes</span>
                                  </div>
                                  <div className="flex space-x-2">
                                    {post.category && (
                                      <Badge color="purple" size="sm">
                                        {post.category}
                                      </Badge>
                                    )}
                                    {post.tags?.slice(0, 2).map((tag) => (
                                      <Badge
                                        key={tag}
                                        color="gray"
                                        size="sm"
                                        className="cursor-pointer"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          addTagFilter(tag);
                                        }}
                                      >
                                        #{tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </Link>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Users */}
                    {searchResults.users.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-lg mb-3 flex items-center">
                          <User className="w-5 h-5 mr-2" />
                          Users ({searchResults.users.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {searchResults.users.slice(0, 4).map((user) => (
                            <Card
                              key={user.id}
                              className="hover:shadow-md transition-shadow"
                            >
                              <Link
                                to={`/users/${user.username}`}
                                className="flex items-center space-x-3"
                              >
                                <img
                                  src={`https://ui-avatars.com/api/?name=${user.username}&background=random`}
                                  alt={user.username}
                                  className="w-12 h-12 rounded-full"
                                />
                                <div>
                                  <h4
                                    className="font-medium text-blue-600 hover:text-blue-800"
                                    dangerouslySetInnerHTML={{
                                      __html: highlightText(
                                        user.username,
                                        searchQuery
                                      ),
                                    }}
                                  />
                                  <p className="text-gray-600 text-sm">
                                    {user.blogs?.length || 0} posts
                                  </p>
                                </div>
                              </Link>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Comments */}
                    {searchResults.comments.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-lg mb-3 flex items-center">
                          <MessageSquare className="w-5 h-5 mr-2" />
                          Comments ({searchResults.comments.length})
                        </h3>
                        <div className="space-y-3">
                          {searchResults.comments.slice(0, 3).map((comment) => (
                            <Card
                              key={comment.id}
                              className="hover:shadow-md transition-shadow"
                            >
                              <Link to={`/posts/${comment.blogId}`}>
                                <p
                                  className="text-gray-700"
                                  dangerouslySetInnerHTML={{
                                    __html: highlightText(
                                      comment.content,
                                      searchQuery
                                    ),
                                  }}
                                />
                                <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                                  <span>by {comment.user.username}</span>
                                  <span>in "{comment.blogTitle}"</span>
                                </div>
                              </Link>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Tabs.Item>

                <Tabs.Item
                  title={`Posts (${searchResults.posts.length})`}
                  icon={FileText}
                >
                  {/* Full posts results */}
                  <div className="space-y-4">
                    {searchResults.posts.map((post) => (
                      <Card
                        key={post.id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <Link to={`/posts/${post.id}`} className="block">
                          <h4
                            className="font-medium text-blue-600 hover:text-blue-800 text-lg"
                            dangerouslySetInnerHTML={{
                              __html: highlightText(post.title, searchQuery),
                            }}
                          />
                          <p
                            className="text-gray-600 mt-2"
                            dangerouslySetInnerHTML={{
                              __html: highlightText(
                                post.content.substring(0, 200) + "...",
                                searchQuery
                              ),
                            }}
                          />
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>by {post.user.username}</span>
                              <span>
                                {new Date(
                                  post.dateCreated
                                ).toLocaleDateString()}
                              </span>
                              <span>{post.likes} likes</span>
                              <span>{post.comments?.length || 0} comments</span>
                            </div>
                            <div className="flex space-x-2">
                              {post.category && (
                                <Badge color="purple" size="sm">
                                  {post.category}
                                </Badge>
                              )}
                              {post.tags?.map((tag) => (
                                <Badge
                                  key={tag}
                                  color="gray"
                                  size="sm"
                                  className="cursor-pointer"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    addTagFilter(tag);
                                  }}
                                >
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </Link>
                      </Card>
                    ))}
                  </div>
                </Tabs.Item>

                <Tabs.Item
                  title={`Users (${searchResults.users.length})`}
                  icon={User}
                >
                  {/* Full users results */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchResults.users.map((user) => (
                      <Card
                        key={user.id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <Link
                          to={`/users/${user.username}`}
                          className="text-center"
                        >
                          <img
                            src={`https://ui-avatars.com/api/?name=${user.username}&background=random`}
                            alt={user.username}
                            className="w-16 h-16 rounded-full mx-auto mb-3"
                          />
                          <h4
                            className="font-medium text-blue-600 hover:text-blue-800"
                            dangerouslySetInnerHTML={{
                              __html: highlightText(user.username, searchQuery),
                            }}
                          />
                          <p className="text-gray-600 text-sm mt-1">
                            {user.blogs?.length || 0} posts
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            Joined{" "}
                            {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </Link>
                      </Card>
                    ))}
                  </div>
                </Tabs.Item>

                <Tabs.Item
                  title={`Comments (${searchResults.comments.length})`}
                  icon={MessageSquare}
                >
                  {/* Full comments results */}
                  <div className="space-y-4">
                    {searchResults.comments.map((comment) => (
                      <Card
                        key={comment.id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <Link to={`/posts/${comment.blogId}`}>
                          <p
                            className="text-gray-700"
                            dangerouslySetInnerHTML={{
                              __html: highlightText(
                                comment.content,
                                searchQuery
                              ),
                            }}
                          />
                          <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                            <div className="flex items-center space-x-3">
                              <span>by {comment.user.username}</span>
                              <span>
                                {new Date(
                                  comment.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <span className="text-blue-600">
                              in "{comment.blogTitle}"
                            </span>
                          </div>
                        </Link>
                      </Card>
                    ))}
                  </div>
                </Tabs.Item>
              </Tabs.Group>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500">
              <Search className="w-16 h-16 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Search the Forum</h3>
              <p className="text-center">
                Type at least 3 characters to search for posts, users, and
                comments.
                <br />
                Use filters to narrow down your results.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SearchSystem;
