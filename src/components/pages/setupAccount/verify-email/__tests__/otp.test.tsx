import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EmailVerification from "../otp";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { showPageToast } from "../../../../util/pageToast";

// ✅ Add explicit global type for fetch
declare const globalThis:  { fetch: jest.Mock };

// ✅ Mock modules
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
}));

jest.mock("../../../../util/pageToast", () => ({
  showPageToast: jest.fn(),
}));

jest.mock("../../../../reduxstore/redux", () => ({
  persistor: { flush: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock("../../../../reduxstore/authstore", () => ({
  setAuthData: jest.fn((data) => ({ type: "SET_AUTH_DATA", payload: data })),
}));

jest.mock("jwt-decode", () => ({
  jwtDecode: jest.fn(() => ({
    email: "decoded@example.com",
    id: "123",
  })),
}));

describe("EmailVerification Component", () => {
  const mockNavigate = jest.fn();
  const mockDispatch = jest.fn();

  beforeEach(() => {
    // ✅ Use `as unknown as jest.Mock` for type compatibility
    (useNavigate as unknown as jest.Mock).mockReturnValue(mockNavigate);
    (useDispatch as unknown as jest.Mock).mockReturnValue(mockDispatch);
    (showPageToast as jest.Mock).mockClear();

    // ✅ Safe global fetch mock
    globalThis.fetch = jest.fn();
    (globalThis.fetch as jest.Mock).mockClear();

    sessionStorage.clear();
  });

  test("renders verification UI correctly", () => {
    render(<EmailVerification />);
    expect(
      screen.getByText(/Verify Email To Set Up Church!/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Enter 6-character code/i)
    ).toBeInTheDocument();
  });

  test("filters non-alphanumeric characters", () => {
    render(<EmailVerification />);
    const input = screen.getByPlaceholderText(/Enter 6-character code/i);
    fireEvent.change(input, { target: { value: "abc!@#" } });
    expect(input).toHaveValue("abc");
  });

  test("shows error toast when email missing", async () => {
    render(<EmailVerification />);
    const input = screen.getByPlaceholderText(/Enter 6-character code/i);
    fireEvent.change(input, { target: { value: "ABC123" } });
    const button = screen.getByRole("button", { name: /Verify email/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(showPageToast).toHaveBeenCalledWith(
        "Email is missing. Please restart the verification process.",
        "error"
      );
    });
  });

  test("successful verification triggers success toast and navigate", async () => {
    sessionStorage.setItem("email", "test@example.com");

    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: "mocked.jwt.token" }),
    });

    render(<EmailVerification />);
    const input = screen.getByPlaceholderText(/Enter 6-character code/i);
    fireEvent.change(input, { target: { value: "ABC123" } });

    const button = screen.getByRole("button", { name: /Verify email/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(showPageToast).toHaveBeenCalledWith(
        "Email verified successfully!",
        "success"
      );
      expect(mockDispatch).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  test("shows error toast on failed verification", async () => {
    sessionStorage.setItem("email", "test@example.com");

    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "Invalid code" } }),
    });

    render(<EmailVerification />);
    const input = screen.getByPlaceholderText(/Enter 6-character code/i);
    fireEvent.change(input, { target: { value: "ABC123" } });
    const button = screen.getByRole("button", { name: /Verify email/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(showPageToast).toHaveBeenCalledWith("Invalid code", "error");
    });
  });

  test("resend verification success toast", async () => {
    sessionStorage.setItem("email", "resend@example.com");
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    render(<EmailVerification />);
    const resendButton = screen.getByRole("button", { name: /Click to resend/i });
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(showPageToast).toHaveBeenCalledWith(
        "Verification code resent to resend@example.com",
        "success"
      );
    });
  });

  test("resend verification error toast", async () => {
    sessionStorage.setItem("email", "resend@example.com");
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

    render(<EmailVerification />);
    const resendButton = screen.getByRole("button", { name: /Click to resend/i });
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(showPageToast).toHaveBeenCalledWith(
        "Failed to resend code",
        "error"
      );
    });
  });
});
