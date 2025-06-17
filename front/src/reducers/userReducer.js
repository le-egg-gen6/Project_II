import { createSlice } from "@reduxjs/toolkit";
import blogService from "../services/blogs";

const userSlice = createSlice({
  name: "user",
  initialState: null,
  reducers: {
    setUser(state, action) {
      return action.payload;
    },
  },
});

export const { setUser } = userSlice.actions;

export const logoutUser = () => {
  return async (dispatch) => {
    try {
      // Clear localStorage
      localStorage.removeItem("loggedBlogappUser");
      localStorage.removeItem("AKAppSessionID");

      // Clear user state
      dispatch(setUser(null));

      // Emit logout event to socket if connected
      if (window.socket && window.socket.connected) {
        window.socket.emit("logout");
        window.socket.disconnect();
        window.socket = null;
      }
    } catch (error) {
      console.error("Logout error:", error);
      dispatch(setUser(null));
    }
  };
};

export const initializeUsers = () => {
  return (dispatch) => {
    const loggedUserJSON = window.localStorage.getItem("AKAppSessionID");
    if (loggedUserJSON) {
      const user = JSON.parse(loggedUserJSON);
      dispatch(setUser(user));
      blogService.setToken(user.token);
    }
  };
};

export default userSlice.reducer;
