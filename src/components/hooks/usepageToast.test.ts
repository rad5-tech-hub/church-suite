import { renderHook } from "@testing-library/react";
import { usePageToast } from "./usePageToast";
import { setActivePage, getActivePage } from "../util/pageToast";

// Mock the utility functions
jest.mock("../util/pageToast", () => ({
  setActivePage: jest.fn(),
  getActivePage: jest.fn(),
}));

describe("usePageToast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call setActivePage with pageId when mounted", () => {
    renderHook(() => usePageToast("home"));

    expect(setActivePage).toHaveBeenCalledWith("home");
  });

  it("should call setActivePage('') on unmount if the active page matches", () => {
    (getActivePage as jest.Mock).mockReturnValue("home");

    const { unmount } = renderHook(() => usePageToast("home"));
    unmount();

    expect(setActivePage).toHaveBeenLastCalledWith("");
  });

  it("should not reset active page if another page becomes active", () => {
    (getActivePage as jest.Mock).mockReturnValue("dashboard");

    const { unmount } = renderHook(() => usePageToast("home"));
    unmount();

    expect(setActivePage).not.toHaveBeenCalledWith("");
  });

  it("should handle empty pageId gracefully", () => {
    renderHook(() => usePageToast(""));

    expect(setActivePage).not.toHaveBeenCalled();
  });
});
