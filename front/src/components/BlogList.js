"use client";

import Blog from "../components/Blog";
import { useSelector } from "react-redux";
import BlogFooter from "./BlogFooter";
import { useState } from "react";
import CategoryTagSystem from "./CategoryTagSystem";
import { Card, Button } from "flowbite-react";
import { Filter, Grid, List } from "lucide-react";

const BlogList = () => {
  const blogs = useSelector((state) => state.blogs);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid or list

  // Filter blogs based on category and tags
  const filteredBlogs = blogs.filter((blog) => {
    const categoryMatch =
      !selectedCategory || blog.category === selectedCategory;
    const tagsMatch =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => blog.tags?.includes(tag));
    return categoryMatch && tagsMatch;
  });

  const sortedBlogs = [...filteredBlogs].sort((a, b) =>
    a.likes > b.likes ? -1 : 1
  );

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedTags([]);
  };

  const hasActiveFilters = selectedCategory || selectedTags.length > 0;

  return (
    <div className="">
      <main className="pt-8 pb-16 lg:pt-16 lg:pb-24 bg-white dark:bg-gray-900 min-h-screen">
        <div className="flex justify-between px-4 mx-auto max-w-6xl ">
          <article className="mx-auto w-full max-w-6xl format format-sm sm:format-base lg:format-lg format-blue dark:format-invert">
            <header className="mb-4 lg:mb-6 not-format">
              <div className="flex justify-between items-center">
                <h1 className="mb-4 text-4xl tracking-tight font-bold text-gray-900 dark:text-white">
                  Posts
                </h1>
                <div className="flex items-center space-x-3">
                  {/* View Mode Toggle */}
                  <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded ${
                        viewMode === "grid"
                          ? "bg-white dark:bg-gray-600 shadow-sm"
                          : "hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded ${
                        viewMode === "list"
                          ? "bg-white dark:bg-gray-600 shadow-sm"
                          : "hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Filter Toggle */}
                  <Button
                    size="sm"
                    color={hasActiveFilters ? "blue" : "gray"}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                    {hasActiveFilters && (
                      <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                        {(selectedCategory ? 1 : 0) + selectedTags.length}
                      </span>
                    )}
                  </Button>
                </div>
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <Card className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Filter Posts</h3>
                    {hasActiveFilters && (
                      <Button size="sm" color="gray" onClick={clearFilters}>
                        Clear All
                      </Button>
                    )}
                  </div>
                  <CategoryTagSystem
                    selectedCategory={selectedCategory}
                    selectedTags={selectedTags}
                    onCategoryChange={setSelectedCategory}
                    onTagsChange={setSelectedTags}
                    mode="filter"
                  />
                </Card>
              )}

              {/* Results Summary */}
              <div className="flex justify-between items-center mb-6">
                <p className="text-gray-600 dark:text-gray-400">
                  {hasActiveFilters ? (
                    <>
                      Showing {sortedBlogs.length} of {blogs.length} posts
                      {selectedCategory && (
                        <span className="ml-2">
                          in <strong>{selectedCategory}</strong>
                        </span>
                      )}
                      {selectedTags.length > 0 && (
                        <span className="ml-2">
                          tagged with <strong>{selectedTags.join(", ")}</strong>
                        </span>
                      )}
                    </>
                  ) : (
                    `${blogs.length} posts`
                  )}
                </p>
              </div>
            </header>

            {/* Posts Grid/List */}
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 gap-6"
                  : "space-y-4"
              }
            >
              {sortedBlogs.length > 0 ? (
                sortedBlogs.map((blog) => (
                  <Blog key={blog.id} blog={blog} viewMode={viewMode} />
                ))
              ) : hasActiveFilters ? (
                <div className="col-span-full text-center py-12">
                  <div className="text-gray-500 dark:text-gray-400">
                    <Filter className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No posts found</h3>
                    <p>Try adjusting your filters or search criteria.</p>
                    <Button
                      className="mt-4"
                      color="gray"
                      onClick={clearFilters}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="text-gray-500 dark:text-gray-400">
                    <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                    <p>Be the first to create a post!</p>
                  </div>
                </div>
              )}
            </div>
          </article>
        </div>
      </main>

      <BlogFooter />
    </div>
  );
};

export default BlogList;
