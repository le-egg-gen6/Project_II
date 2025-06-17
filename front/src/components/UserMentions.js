"use client";

import { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";

const UserMentions = ({
  value,
  onChange,
  placeholder = "Type your message...",
  rows = 4,
}) => {
  const allUsers = useSelector((state) => state.allUsers);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [mentionStart, setMentionStart] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);

      // Check if there's a space after @, if so, don't show suggestions
      if (textAfterAt.includes(" ")) {
        setShowSuggestions(false);
        return;
      }

      const matchingUsers = allUsers.filter((user) =>
        user.username.toLowerCase().startsWith(textAfterAt.toLowerCase())
      );

      if (matchingUsers.length > 0 && textAfterAt.length >= 0) {
        setSuggestions(matchingUsers.slice(0, 5));
        setMentionStart(lastAtIndex);
        setShowSuggestions(true);
        setSelectedIndex(0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e) => {
    if (showSuggestions) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % suggestions.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(
            (prev) => (prev - 1 + suggestions.length) % suggestions.length
          );
          break;
        case "Enter":
        case "Tab":
          e.preventDefault();
          insertMention(suggestions[selectedIndex]);
          break;
        case "Escape":
          setShowSuggestions(false);
          break;
      }
    }
  };

  const insertMention = (user) => {
    const beforeMention = value.substring(0, mentionStart);
    const afterCursor = value.substring(textareaRef.current.selectionStart);
    const newValue = `${beforeMention}@${user.username} ${afterCursor}`;

    onChange(newValue);
    setShowSuggestions(false);

    // Set cursor position after the mention
    setTimeout(() => {
      const newCursorPosition = beforeMention.length + user.username.length + 2;
      textareaRef.current.setSelectionRange(
        newCursorPosition,
        newCursorPosition
      );
      textareaRef.current.focus();
    }, 0);
  };

  const renderTextWithMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const parts = text.split(mentionRegex);

    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a username (odd indices after split)
        const user = allUsers.find((u) => u.username === part);
        if (user) {
          return (
            <span
              key={index}
              className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 rounded"
            >
              @{part}
            </span>
          );
        }
      }
      return part;
    });
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
      />

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-48 overflow-y-auto"
        >
          {suggestions.map((user, index) => (
            <div
              key={user.id}
              className={`flex items-center space-x-3 px-4 py-3 cursor-pointer transition-colors ${
                index === selectedIndex
                  ? "bg-blue-50 dark:bg-blue-900/50"
                  : "hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
              onClick={() => insertMention(user)}
            >
              <img
                src={`https://ui-avatars.com/api/?name=${user.username}&background=random`}
                alt={user.username}
                className="w-8 h-8 rounded-full"
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  @{user.username}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.name || "User"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserMentions;
