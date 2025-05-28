// reduxstore/datamanager.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ChurchState {
  churchName: string;
  churchLocation: string;
  churchPhone: string;
  churchEmail: string;
  isHeadquarter: boolean;
  logoPreview: string | null;
  backgroundPreview: string | null;
}

const initialState: ChurchState = {
  churchName: '',
  churchLocation: '',
  churchPhone: '',
  churchEmail: '',
  isHeadquarter: false,
  logoPreview: null,
  backgroundPreview: null,
};

const churchSlice = createSlice({
  name: 'church',
  initialState,
  reducers: {
    setChurchData: (state, action: PayloadAction<Partial<ChurchState>>) => {
      return { ...state, ...action.payload };
    },
    clearChurchData: () => initialState,
  },
});

export const { setChurchData, clearChurchData } = churchSlice.actions;
export default churchSlice.reducer;