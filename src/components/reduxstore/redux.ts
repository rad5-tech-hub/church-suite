// reduxstore/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import storage from 'redux-persist/lib/storage';
import { 
  persistReducer, 
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER 
} from 'redux-persist';
import churchSlice from './datamanager';
import authSlice from './authstore';

// Combine reducers
const rootReducer = combineReducers({
  church: churchSlice,
  auth: authSlice,
});

// Persist configuration
const persistConfig = {
  key: 'root',
  storage,
  // Ignore non-serializable fields
  blacklist: ['church.logoFile', 'church.backgroundFile']
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure the store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],       
      },
    }),
});

export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;