import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { AuthState, UserProfile } from "../lib/types/auth.types";

const initialState: AuthState = {
  user: null,
  status: "idle",
  error: null,
  isVerified: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<UserProfile | null>) {
      state.user = action.payload;
      state.isVerified = true;
      state.status = action.payload ? "succeeded" : "idle";
      state.error = null;
    },

    clearUser(state) {
      state.user = null;
      state.isVerified = false;
      state.status = "idle";
      state.error = null;
    },

    setAuthLoading(state) {
      state.status = "loading";
      state.error = null;
    },

    setAuthError(state, action: PayloadAction<string>) {
      state.status = "failed";
      state.error = action.payload;
    },
  },
});

export const { setUser, clearUser, setAuthLoading, setAuthError } =
  authSlice.actions;

export default authSlice.reducer;
