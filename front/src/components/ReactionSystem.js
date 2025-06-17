"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Button, Tooltip } from "flowbite-react";
import { Heart, Laugh, Frown, ThumbsUp, Eye, Flame } from "lucide-react";
import axios from "axios";

const ReactionSystem = ({ blogId, onReactionUpdate }) => {
  const user = useSelector((state) => state.users);
  const [reactions, setReactions] = useState([]);
  const [userReaction, setUserReaction] = useState(null);
  const [showReactions, setShowReactions] = useState(false);

  const reactionTypes = [
    { type: "like", icon: ThumbsUp, color: "text-blue-500", label: "Like" },
    { type: "love", icon: Heart, color: "text-red-500", label: "Love" },
    { type: "laugh", icon: Laugh, color: "text-yellow-500", label: "Laugh" },
    { type: "wow", icon: Eye, color: "text-purple-500", label: "Wow" },
    { type: "sad", icon: Frown, color: "text-gray-500", label: "Sad" },
    { type: "angry", icon: Flame, color: "text-orange-500", label: "Angry" },
  ];

  useEffect(() => {
    fetchReactions();
  }, [blogId]);

  const fetchReactions = async () => {
    try {
      const response = await axios.get(`/api/reactions/${blogId}`);
      setReactions(response.data.reactions || []);

      if (user) {
        const myReaction = response.data.reactions?.find(
          (r) => r.user._id === user.id
        );
        setUserReaction(myReaction?.type || null);
      }
    } catch (error) {
      console.error("Failed to fetch reactions:", error);
    }
  };

  const handleReaction = async (type) => {
    if (!user) return;

    try {
      const config = {
        headers: { Authorization: `bearer ${user.token}` },
      };

      if (userReaction === type) {
        // Remove reaction
        await axios.delete(`/api/reactions/${blogId}`, config);
        setUserReaction(null);
      } else {
        // Add/update reaction
        await axios.post(`/api/reactions/${blogId}`, { type }, config);
        setUserReaction(type);
      }

      fetchReactions();
      if (onReactionUpdate) onReactionUpdate();
    } catch (error) {
      console.error("Failed to update reaction:", error);
    }
  };

  const getReactionCount = (type) => {
    return reactions.filter((r) => r.type === type).length;
  };

  const getReactionUsers = (type) => {
    return reactions.filter((r) => r.type === type).map((r) => r.user.username);
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Main reaction button */}
      <div className="relative">
        <Button
          size="sm"
          color={userReaction ? "blue" : "gray"}
          onClick={() => setShowReactions(!showReactions)}
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setTimeout(() => setShowReactions(false), 300)}
        >
          {userReaction ? (
            <>
              {React.createElement(
                reactionTypes.find((r) => r.type === userReaction)?.icon ||
                  ThumbsUp,
                {
                  className: `w-4 h-4 mr-1 ${
                    reactionTypes.find((r) => r.type === userReaction)?.color
                  }`,
                }
              )}
              {reactionTypes.find((r) => r.type === userReaction)?.label}
            </>
          ) : (
            <>
              <ThumbsUp className="w-4 h-4 mr-1" />
              React
            </>
          )}
        </Button>

        {/* Reaction picker */}
        {showReactions && (
          <div
            className="absolute bottom-full left-0 mb-2 bg-white border rounded-lg shadow-lg p-2 flex space-x-1 z-10"
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
          >
            {reactionTypes.map(({ type, icon: Icon, color, label }) => (
              <Tooltip key={type} content={label}>
                <button
                  onClick={() => handleReaction(type)}
                  className={`p-2 rounded-full hover:bg-gray-100 transition-all transform hover:scale-110 ${
                    userReaction === type ? "bg-blue-100" : ""
                  }`}
                >
                  <Icon className={`w-5 h-5 ${color}`} />
                </button>
              </Tooltip>
            ))}
          </div>
        )}
      </div>

      {/* Reaction counts */}
      <div className="flex items-center space-x-3">
        {reactionTypes.map(({ type, icon: Icon, color, label }) => {
          const count = getReactionCount(type);
          const users = getReactionUsers(type);

          if (count === 0) return null;

          return (
            <Tooltip
              key={type}
              content={`${users.join(", ")} reacted with ${label}`}
            >
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <Icon className={`w-4 h-4 ${color}`} />
                <span>{count}</span>
              </div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};

export default ReactionSystem;
