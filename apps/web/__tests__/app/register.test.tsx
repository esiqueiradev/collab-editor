import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { mockPush, mockSignIn } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockSignIn: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("next-auth/react", () => ({
  signIn: mockSignIn,
}));

import RegisterPage from "@/app/register/page";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = mockFetch;
});

describe("RegisterPage", () => {
  it("renders name, email, password fields and submit button", () => {
    render(<RegisterPage />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("renders a link to the login page", () => {
    render(<RegisterPage />);

    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute("href", "/login");
  });

  it("renders OAuth buttons for Google and GitHub", () => {
    render(<RegisterPage />);

    expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /github/i })).toBeInTheDocument();
  });

  it("submits to /api/auth/register and signs in on success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: "1", email: "bob@example.com", name: "Bob" }, error: null }),
    });
    mockSignIn.mockResolvedValueOnce({ error: null });

    render(<RegisterPage />);

    await userEvent.type(screen.getByLabelText(/name/i), "Bob");
    await userEvent.type(screen.getByLabelText(/email/i), "bob@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "securepass");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/auth/register",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ name: "Bob", email: "bob@example.com", password: "securepass" }),
        })
      );
    });

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        email: "bob@example.com",
        password: "securepass",
        redirect: false,
      });
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows a server error message when registration fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ data: null, error: "Email already in use" }),
    });

    render(<RegisterPage />);

    await userEvent.type(screen.getByLabelText(/email/i), "taken@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "securepass");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/email already in use/i)).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("disables the button while the request is in flight", async () => {
    mockFetch.mockImplementationOnce(() => new Promise(() => {}));

    render(<RegisterPage />);

    await userEvent.type(screen.getByLabelText(/email/i), "bob@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "securepass");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByRole("button", { name: /creating account/i })).toBeDisabled();
  });
});
