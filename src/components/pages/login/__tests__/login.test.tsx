import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "../login";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "../../../reduxstore/redux.test";
import { toast } from "react-toastify";

// mock navigate
const mockedNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual: any = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

// mock toast
vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  ToastContainer: () => null,
}));

// mock jwtDecode
vi.mock("jwt-decode", () => ({
  jwtDecode: () => ({
    email: "test@mail.com",
    role: "admin",
    branchIds: ["123"],
    churchId: "777",
    branchId: "123",
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();

  // ✅ global fetch mock (Vitest supports this)
  global.fetch = vi.fn();
});

const renderUI = () =>
  render(
    <Provider store={store}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </Provider>
  );

describe("✅ Login Component Tests", () => {
  it("renders login form correctly", () => {
    renderUI();

    // verify the heading, not the button
    expect(screen.getByRole("heading", { name: /log in/i })).toBeInTheDocument();

    expect(screen.getByPlaceholderText("email@gmail.com")).toBeInTheDocument();
  });

  it("toggles password visibility", () => {
    renderUI();

    const passwordInput = screen.getByPlaceholderText("........") as HTMLInputElement;
    const toggleButton = screen.getByRole("button", { name: "" });

    expect(passwordInput.type).toBe("password");
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe("text");
  });

  it("logs in successfully", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: "FAKE.TOKEN",
      }),
    });

    renderUI();

    fireEvent.change(screen.getByPlaceholderText("email@gmail.com"), {
      target: { value: "user@mail.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("........"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
      expect(mockedNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows toast on failed login", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: { message: "Invalid credentials" },
      }),
    });

    renderUI();

    fireEvent.change(screen.getByPlaceholderText("email@gmail.com"), {
      target: { value: "wrong@mail.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("........"), {
      target: { value: "wrongPass" },
    });

    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid credentials", expect.anything());
    });
  });

  it("opens and submits forgot password modal", async () => {
    renderUI();

    fireEvent.click(screen.getByText(/forgot password/i));

    expect(
      screen.getByText("Reset Password")
    ).toBeInTheDocument();

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "done" }),
    });

    fireEvent.change(screen.getByPlaceholderText("Enter your email"), {
      target: { value: "reset@mail.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Password reset link has been sent to your email!",
        expect.anything()
      );
    });
  });
});
