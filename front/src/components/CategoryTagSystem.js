"use client";

import { useState, useEffect } from "react";
import { Badge, Button, TextInput, Dropdown } from "flowbite-react";
import { Plus, X, Hash } from "lucide-react";

const CategoryTagSystem = ({
  selectedCategory,
  selectedTags,
  onCategoryChange,
  onTagsChange,
  mode = "filter",
}) => {
  const [availableTags, setAvailableTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  const categories = [
    { value: "technology", label: "Technology", color: "blue" },
    { value: "science", label: "Science", color: "green" },
    { value: "programming", label: "Programming", color: "purple" },
    { value: "design", label: "Design", color: "pink" },
    { value: "business", label: "Business", color: "yellow" },
    { value: "entertainment", label: "Entertainment", color: "red" },
    { value: "sports", label: "Sports", color: "orange" },
    { value: "health", label: "Health", color: "teal" },
    { value: "education", label: "Education", color: "indigo" },
    { value: "other", label: "Other", color: "gray" },
  ];

  const popularTags = [
    "javascript",
    "react",
    "nodejs",
    "python",
    "webdev",
    "tutorial",
    "beginners",
    "productivity",
    "career",
    "opensource",
    "ai",
    "machinelearning",
    "database",
    "security",
    "mobile",
    "frontend",
    "backend",
    "devops",
    "cloud",
    "startup",
  ];

  useEffect(() => {
    // In a real app, fetch popular tags from API
    setAvailableTags(popularTags);
  }, []);

  const addTag = (tag) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (normalizedTag && !selectedTags.includes(normalizedTag)) {
      onTagsChange([...selectedTags, normalizedTag]);
      if (!availableTags.includes(normalizedTag)) {
        setAvailableTags([...availableTags, normalizedTag]);
      }
    }
    setNewTag("");
    setShowTagInput(false);
  };

  const removeTag = (tagToRemove) => {
    onTagsChange(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const getCategoryColor = (categoryValue) => {
    return (
      categories.find((cat) => cat.value === categoryValue)?.color || "gray"
    );
  };

  const getCategoryLabel = (categoryValue) => {
    return (
      categories.find((cat) => cat.value === categoryValue)?.label ||
      categoryValue
    );
  };

  return (
    <div className="space-y-4">
      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Category{" "}
          {mode === "create" && <span className="text-red-500">*</span>}
        </label>
        <Dropdown
          label={
            selectedCategory
              ? getCategoryLabel(selectedCategory)
              : "Select Category"
          }
          color={selectedCategory ? getCategoryColor(selectedCategory) : "gray"}
          size="sm"
        >
          {mode === "filter" && (
            <Dropdown.Item onClick={() => onCategoryChange("")}>
              All Categories
            </Dropdown.Item>
          )}
          {categories.map((category) => (
            <Dropdown.Item
              key={category.value}
              onClick={() => onCategoryChange(category.value)}
            >
              <div className="flex items-center space-x-2">
                <Badge color={category.color} size="sm">
                  {category.label}
                </Badge>
              </div>
            </Dropdown.Item>
          ))}
        </Dropdown>
      </div>

      {/* Tags Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tags {mode === "create" && "(optional)"}
        </label>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedTags.map((tag) => (
              <Badge
                key={tag}
                color="blue"
                className="flex items-center space-x-1"
              >
                <Hash className="w-3 h-3" />
                <span>{tag}</span>
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:bg-blue-600 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Add New Tag */}
        <div className="flex items-center space-x-2 mb-3">
          {showTagInput ? (
            <div className="flex items-center space-x-2 flex-1">
              <TextInput
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Enter tag name..."
                size="sm"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    addTag(newTag);
                  }
                }}
                autoFocus
              />
              <Button
                size="xs"
                onClick={() => addTag(newTag)}
                disabled={!newTag.trim()}
              >
                Add
              </Button>
              <Button
                size="xs"
                color="gray"
                onClick={() => setShowTagInput(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              color="gray"
              onClick={() => setShowTagInput(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Tag
            </Button>
          )}
        </div>

        {/* Popular Tags */}
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Popular tags:
          </p>
          <div className="flex flex-wrap gap-2">
            {availableTags
              .filter((tag) => !selectedTags.includes(tag))
              .slice(0, 15)
              .map((tag) => (
                <button
                  key={tag}
                  onClick={() => addTag(tag)}
                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  #{tag}
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryTagSystem;
