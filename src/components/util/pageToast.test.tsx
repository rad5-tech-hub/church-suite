import { toast } from "react-toastify";
import {
  setActivePage,
  getActivePage,
  showPageToast,
} from "./pageToast";

// Mock react-toastify methods
jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    dismiss: jest.fn(),
  },
}));

describe("pageToast utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // reset module state between tests
    setActivePage(""); // resets any activePageId
  });

  it("should set and get active page correctly", () => {
    setActivePage("page1");
    expect(getActivePage()).toBe("page1");
  });

  it("should dismiss old toasts when switching pages", () => {
    // simulate first page with previous toasts
    setActivePage("page1");
    showPageToast("Toast for page1");
    expect(toast.success).toHaveBeenCalledTimes(1);

    // switch to another page
    setActivePage("page2");

    // old toasts should be dismissed
    expect(toast.dismiss).toHaveBeenCalled();
    expect(getActivePage()).toBe("page2");
  });

  it("should show success toast when type is success", () => {
    setActivePage("page1");
    showPageToast("Success message", "success");
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        toastId: expect.stringMatching(/^toast-page1-/),
      })
    );
  });

  it("should show error toast when type is error", () => {
    setActivePage("page1");
    showPageToast("Error message", "error");
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        toastId: expect.stringMatching(/^toast-page1-/),
      })
    );
  });

  it("should show warning toast when type is warning", () => {
    setActivePage("page1");
    showPageToast("Warning message", "warning");
    expect(toast.warn).toHaveBeenCalledTimes(1);
  });

  it("should warn if called without an active page", () => {
    const consoleWarnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => {});
    showPageToast("No page set");
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("⚠️ Call setActivePage(pageId)")
    );
    expect(toast.success).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it("should track multiple toasts per page", () => {
    setActivePage("page1");
    const id1 = showPageToast("First");
    const id2 = showPageToast("Second");
    expect(id1).not.toBe(id2);
    expect(toast.success).toHaveBeenCalledTimes(2);
  });
});
