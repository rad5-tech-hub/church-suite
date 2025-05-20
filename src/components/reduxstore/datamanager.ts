import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Make sure to export the interface
export interface ChurchState {
  churchName: string;
  churchEmail: string;
  churchPhone: string;
  churchLocation: string;
  isHeadquarter: string;
  logoPreview?: string | null; // Optional field for logo preview
  backgroundPreview?: string | null;
  logoFile?: File | null; // For storing the actual file
  backgroundFile?: File | null; //
}

const initialState: ChurchState = {
  churchName: '',
  churchEmail: '',
  churchPhone: '',
  churchLocation: '',
  isHeadquarter: '',
  logoPreview: null, // Default value
  backgroundPreview: null, // Default value
  logoFile: null,
  backgroundFile: null,
};

const churchSlice = createSlice({
  name: 'church',
  initialState,
  reducers: {
    setChurchData: (state, action: PayloadAction<Partial<ChurchState>>) => {
      return { ...state, ...action.payload }; // Merge partial updates
    },
    clearChurchData: () => initialState,
  },
});

export const { setChurchData, clearChurchData } = churchSlice.actions;
export default churchSlice.reducer;