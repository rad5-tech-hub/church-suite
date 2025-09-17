// authstore.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AuthData {
  backgroundImg?: string;
  churchId: string;
  church_name: string;
  email: string;
  exp: number;
  iat: number;
  id: string;
  isHeadQuarter?: boolean;
  isSuperAdmin?: boolean;
  logo: string;
  name: string;
  tenantId: string;
  token: string;
  branchId: string;
  role: string;          // ✅ added
  branches: string[];   // ✅ fixed spelling
}

// Export AuthState interface
export interface AuthState {
  authData: AuthData | null;
}

const initialState: AuthState = {
  authData: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthData: (state, action: PayloadAction<AuthData>) => {
      state.authData = action.payload;
    },
    clearAuth: (state) => {
      state.authData = null;
    },
  },
});

export const { setAuthData, clearAuth } = authSlice.actions;
export default authSlice.reducer;