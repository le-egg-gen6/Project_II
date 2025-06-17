"use client";

import { useState } from "react";
import { Navbar, Dropdown } from "flowbite-react";
import { useDispatch } from "react-redux";
import { logoutUser } from "../reducers/userReducer";
import { useNavigate } from "react-router-dom";
import ForumIcon from "@mui/icons-material/Forum";
import { Search, Plus, Sun, Moon, Info, ChevronDown } from "lucide-react";
import SearchSystem from "./SearchSystem";
import NotificationPanel from "./NotificationPanel";

const NavigationBar = ({ user, handleThemeSwitch, theme }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);

  const logout = async (event) => {
    // event.preventDefault();
    // event.stopPropagation();

    try {
      console.log("Logging out user...");

      // Use the proper logout action
      await dispatch(logoutUser());

      // Small delay to ensure cleanup is complete
      setTimeout(() => {
        window.location.replace("/login");
      }, 100);
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect anyway
      window.location.replace("/login");
    }
  };

  const username = user?.username || user?.name || "User";

  return (
    <>
      <Navbar
        fluid={true}
        className="px-6 py-4 bg-white/90 backdrop-blur-md border-b border-gray-200 dark:bg-gray-900/90 dark:border-gray-700 sticky top-0 z-40 shadow-sm"
      >
        {/* Left side - Logo and About */}
        <div className="flex items-center space-x-6">
          <Navbar.Brand href="/" className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <ForumIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Forum App
            </span>
          </Navbar.Brand>

          <button
            onClick={() => navigate("/about")}
            className="hidden md:flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Info className="w-4 h-4" />
            <span>About</span>
          </button>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-3">
          {/* Search Button */}
          <button
            onClick={() => setShowSearch(true)}
            className="hidden md:flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
            <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 rounded">
              ⌘K
            </kbd>
          </button>

          {/* Notifications */}
          {user && <NotificationPanel />}

          {/* Create Post Button */}
          {user && (
            <button
              onClick={() => navigate("/create")}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl shadow-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create</span>
            </button>
          )}

          {/* User Dropdown */}
          {user ? (
            <Dropdown
              label=""
              dismissOnClick={false}
              renderTrigger={() => (
                <div className="flex items-center space-x-3 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors cursor-pointer">
                  <img
                    src={`https://ui-avatars.com/api/?name=${username}&background=random`}
                    alt={username}
                    className="w-8 h-8 rounded-full ring-2 ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      @{username}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                </div>
              )}
            >
              <Dropdown.Header>
                <span className="block text-sm font-medium">@{username}</span>
                <span className="block text-sm text-gray-500 truncate">
                  {user.email || "User"}
                </span>
              </Dropdown.Header>
              <Dropdown.Item href={`/users/${username}`}>
                My Profile
              </Dropdown.Item>
              <Dropdown.Item href="/settings">Settings</Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={logout}>Sign out</Dropdown.Item>
            </Dropdown>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl shadow-lg transition-colors"
            >
              Sign In
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={handleThemeSwitch}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {theme ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <Navbar.Toggle className="md:hidden" />
        </div>

        {/* Mobile Menu */}
        <Navbar.Collapse className="md:hidden">
          <Navbar.Link
            href="/about"
            className="text-gray-700 dark:text-gray-300 hover:text-blue-600"
          >
            About
          </Navbar.Link>
          <Navbar.Link
            onClick={() => setShowSearch(true)}
            className="text-gray-700 dark:text-gray-300 hover:text-blue-600 cursor-pointer"
          >
            Search
          </Navbar.Link>
          {user && (
            <Navbar.Link
              href="/create"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600"
            >
              Create Post
            </Navbar.Link>
          )}
        </Navbar.Collapse>
      </Navbar>

      {/* Search Modal */}
      <SearchSystem isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
};

export default NavigationBar;
