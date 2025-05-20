import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
  authToken: string | null; // Token for authentication
  authData: Record<string, any> | null; // Decoded token data or other auth-related data
}

const initialState: AuthState = {
  authToken: null,
  authData: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthToken: (state, action: PayloadAction<string>) => {
      state.authToken = action.payload; // Update the token
    },
    setAuthData: (state, action: PayloadAction<Record<string, any>>) => {
      state.authData = action.payload; // Update the decoded token data
    },
    clearAuth: () => initialState, // Reset the auth state
  },
});

export const { setAuthToken, setAuthData, clearAuth } = authSlice.actions;
export default authSlice.reducer;