import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ChurchState {
  churchName: string;
  churchEmail: string;
  churchPhone: string;
  churchLocation: string;
  isHeadquarter: string;
  logoPreview?: string | null;
  backgroundPreview?: string | null;
  // Remove File objects from state - we'll store them locally in components
}

const initialState: ChurchState = {
  churchName: '',
  churchEmail: '',
  churchPhone: '',
  churchLocation: '',
  isHeadquarter: '',
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