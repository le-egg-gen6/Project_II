import { useSelector } from "react-redux";
import { Calendar, User } from "lucide-react";

const Comment = ({ comment }) => {
  const allUsers = useSelector((state) => state.allUsers);

  // Find the user who made the comment
  const commentUser = allUsers.find((user) => user.id === comment.user) || {
    username: "Unknown User",
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
      <div className="flex items-start space-x-3">
        <img
          src={`https://ui-avatars.com/api/?name=${commentUser.username}&background=random`}
          alt={commentUser.username}
          className="w-10 h-10 rounded-full"
        />
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <div className="flex items-center space-x-1">
              <User className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-blue-600 dark:text-blue-400">
                u/{commentUser.username}
              </span>
            </div>
            <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 text-sm">
              <Calendar className="w-3 h-3" />
              <span>
                {comment.dateCreated
                  ? new Date(comment.dateCreated).toLocaleDateString()
                  : "Just now"}
              </span>
            </div>
          </div>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {comment.content}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Comment;
