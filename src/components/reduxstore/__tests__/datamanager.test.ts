/// <reference types="vitest" />

import { describe, it, expect } from "vitest";
import churchReducer, { setChurchData, clearChurchData, ChurchState } from "../datamanager";

describe("church Redux Slice", () => {
  
  const initialState: ChurchState = {
    churchName: "",
    churchLocation: "",
    churchPhone: "",
    churchEmail: "",
    isHeadquarter: false,
    logoPreview: null,
    backgroundPreview: null,
  };

  // ✅ Test 1: returns initial state when passed an empty action
  it("should return the initial state by default", () => {
    const result = churchReducer(undefined, { type: "" });
    expect(result).toEqual(initialState);
  });

  // ✅ Test 2: correctly sets church data
  it("should update church data when setChurchData is dispatched", () => {
    const result = churchReducer(
      initialState,
      setChurchData({
        churchName: "Test Church",
        churchLocation: "Lagos",
        churchPhone: "123456789",
        churchEmail: "test@church.com",
        isHeadquarter: true,
      })
    );

    expect(result).toEqual({
      ...initialState,
      churchName: "Test Church",
      churchLocation: "Lagos",
      churchPhone: "123456789",
      churchEmail: "test@church.com",
      isHeadquarter: true,
    });
  });

  // ✅ Test 3: supports partial updates (PATCH-like behavior)
  it("should update only the provided fields (partial payload)", () => {
    const currentState: ChurchState = {
      ...initialState,
      churchName: "Existing Church",
      churchPhone: "999999999",
    };

    const result = churchReducer(
      currentState,
      setChurchData({ churchEmail: "updated@mail.com" })
    );

    expect(result).toEqual({
      ...currentState,
      churchEmail: "updated@mail.com",
    });
  });

  // ✅ Test 4: clearChurchData resets to initialState
  it("should reset state to initial state when clearChurchData is dispatched", () => {
    const modifiedState: ChurchState = {
      churchName: "Modified",
      churchLocation: "Abuja",
      churchPhone: "8888888",
      churchEmail: "modified@mail.com",
      isHeadquarter: true,
      logoPreview: "logo.png",
      backgroundPreview: "bg.png",
    };

    const result = churchReducer(modifiedState, clearChurchData());

    expect(result).toEqual(initialState);
  });
});
