/// <reference types="vitest" />

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router-dom";
import { act } from "react";

import churchReducer, { ChurchState } from "../../../../reduxstore/datamanager";
import SetupChurch from "../setupstep1";

/* -------------------------------------------------
   Types
   ------------------------------------------------- */
interface RootState {
  church: ChurchState;
}

/* -------------------------------------------------
   Mock react-router-dom
   ------------------------------------------------- */
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

/* -------------------------------------------------
   Store & render helpers
   ------------------------------------------------- */
const createStore = (preloadedState?: Partial<RootState>) =>
  configureStore({
    reducer: { church: churchReducer },
    preloadedState: {
      church: {
        churchName: "",
        churchEmail: "",
        churchPhone: "",
        churchLocation: "",
        isHeadquarter: false,
        logoPreview: null,
        backgroundPreview: null,
        ...preloadedState?.church,
      },
    },
  });

const renderWithStore = (preloadedState?: Partial<RootState>) => {
  const store = createStore(preloadedState);
  return {
    ...render(
      <Provider store={store}>
        <MemoryRouter>
          <SetupChurch />
        </MemoryRouter>
      </Provider>
    ),
    store,
  };
};

/* -------------------------------------------------
   Test suite
   ------------------------------------------------- */
describe("SetupChurch Component", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    vi.clearAllTimers();
  });

  /* -------------------------------------------------
     1. Empty form → validation error (sync)
     ------------------------------------------------- */
  it("should show validation error when submitting empty form", async () => {
    renderWithStore();

    const form = screen.getByRole("button", { name: /continue/i }).closest("form");
    
    // Prevent default HTML5 validation and trigger submit
    fireEvent.submit(form!, { preventDefault: () => {} });

    // validation error should appear
    await waitFor(() => {
      expect(screen.getByText("Church name is required")).toBeInTheDocument();
    });
  });

  /* -------------------------------------------------
     2. Fill + submit → Redux + navigation
     ------------------------------------------------- */
  it("should update inputs and submit form successfully", async () => {
    vi.useFakeTimers();
    
    const { store } = renderWithStore();

    // Fill in the form
    const nameInput = screen.getByPlaceholderText(/enter the name of your church/i);
    const phoneInput = screen.getByPlaceholderText(/enter the phone number/i);
    const locationInput = screen.getByPlaceholderText(/enter the location/i);
    const select = screen.getByRole("combobox");

    fireEvent.change(nameInput, { target: { value: "Global Church" } });
    fireEvent.change(phoneInput, { target: { value: "08123456789" } });
    fireEvent.change(locationInput, { target: { value: "Lagos" } });
    fireEvent.change(select, { target: { value: "true" } });

    // Submit the form
    const form = screen.getByRole("button", { name: /continue/i }).closest("form");
    fireEvent.submit(form!);

    // Advance the 2-second setTimeout
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Check Redux state
    await waitFor(() => {
      const s = store.getState().church;
      expect(s.churchName).toBe("Global Church");
      expect(s.churchLocation).toBe("Lagos");
      expect(s.isHeadquarter).toBe(true);
    });

    // Check navigation
    expect(mockNavigate).toHaveBeenCalledWith("/setup-logo");
    
    vi.useRealTimers();
  });

  /* -------------------------------------------------
     3. Loading text appears → disappears after timer
     ------------------------------------------------- */
  it("should show loading text when submitting", async () => {
    vi.useFakeTimers();
    
    renderWithStore();

    // Fill in the form
    const nameInput = screen.getByPlaceholderText(/enter the name of your church/i);
    const phoneInput = screen.getByPlaceholderText(/enter the phone number/i);
    const locationInput = screen.getByPlaceholderText(/enter the location/i);
    const select = screen.getByRole("combobox");

    fireEvent.change(nameInput, { target: { value: "Test Church" } });
    fireEvent.change(phoneInput, { target: { value: "09012345678" } });
    fireEvent.change(locationInput, { target: { value: "Abuja" } });
    fireEvent.change(select, { target: { value: "false" } });

    // Submit the form
    const form = screen.getByRole("button", { name: /continue/i }).closest("form");
    fireEvent.submit(form!);

    // Loading text should appear immediately
    expect(screen.getByText("Continuing...")).toBeInTheDocument();

    // Advance timers
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Loading text should disappear
    await waitFor(() => {
      expect(screen.queryByText("Continuing...")).not.toBeInTheDocument();
    });
    
    vi.useRealTimers();
  });
});