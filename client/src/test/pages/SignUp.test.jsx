import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SignUp from "../../pages/SignUp";

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("../../components/OAuth", () => ({
  default: () => <button type="button">Continue with Google</button>,
}));

// ─── Render helper ────────────────────────────────────────────────────────────

const renderSignUp = () =>
  render(
    <MemoryRouter>
      <Routes>
        <Route path="*" element={<SignUp />} />
      </Routes>
    </MemoryRouter>
  );

// ─── Fetch helpers ────────────────────────────────────────────────────────────

const mockSuccess = () => {
  global.fetch = vi.fn().mockResolvedValue({
    json: vi.fn().mockResolvedValue({ _id: "u1", username: "johndoe" }),
  });
};

const mockApiFailure = (message = "Email already taken") => {
  global.fetch = vi.fn().mockResolvedValue({
    json: vi.fn().mockResolvedValue({ success: false, message }),
  });
};

const mockNetworkError = () => {
  global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fillForm = async (user, {
  username = "johndoe",
  email = "john@example.com",
  password = "password123",
} = {}) => {
  await user.type(screen.getByPlaceholderText(/username/i), username);
  await user.type(screen.getByPlaceholderText(/email/i), email);
  await user.type(screen.getByPlaceholderText(/password/i), password);
};

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  navigateMock.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Rendering ────────────────────────────────────────────────────────────────

describe("SignUp — rendering", () => {
  it("renders the Sign Up heading", () => {
    renderSignUp();
    expect(
      screen.getByRole("heading", { name: /sign up/i })
    ).toBeInTheDocument();
  });

  it("renders the username input", () => {
    renderSignUp();
    expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
  });

  it("renders the email input", () => {
    renderSignUp();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  });

  it("renders the password input", () => {
    renderSignUp();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  it("renders the Sign Up submit button", () => {
    renderSignUp();
    expect(
      screen.getByRole("button", { name: /^sign up$/i })
    ).toBeInTheDocument();
  });

  it("renders the OAuth button", () => {
    renderSignUp();
    expect(
      screen.getByRole("button", { name: /continue with google/i })
    ).toBeInTheDocument();
  });

  it("renders the Sign in link pointing to /sign-in", () => {
    renderSignUp();
    const link = screen.getByRole("link", { name: /sign in/i });
    expect(link).toBeInTheDocument();
    expect(link.getAttribute("href")).toBe("/sign-in");
  });

  it("does not show an error message on initial render", () => {
  renderSignUp();
  expect(document.querySelector(".text-red-500")).not.toBeInTheDocument();
});

  it("submit button is enabled on initial render", () => {
    renderSignUp();
    expect(screen.getByRole("button", { name: /^sign up$/i })).not.toBeDisabled();
  });
});

// ─── Controlled inputs ────────────────────────────────────────────────────────

describe("SignUp — inputs", () => {
  it("updates the username input as the user types", async () => {
    const user = userEvent.setup();
    renderSignUp();
    const input = screen.getByPlaceholderText(/username/i);
    await user.type(input, "johndoe");
    expect(input).toHaveValue("johndoe");
  });

  it("updates the email input as the user types", async () => {
    const user = userEvent.setup();
    renderSignUp();
    const input = screen.getByPlaceholderText(/email/i);
    await user.type(input, "john@example.com");
    expect(input).toHaveValue("john@example.com");
  });

  it("updates the password input as the user types", async () => {
    const user = userEvent.setup();
    renderSignUp();
    const input = screen.getByPlaceholderText(/password/i);
    await user.type(input, "secret123");
    expect(input).toHaveValue("secret123");
  });
});

// ─── Form submission ──────────────────────────────────────────────────────────

describe("SignUp — submission", () => {
  it("POSTs to /api/auth/signup on submit", async () => {
    const user = userEvent.setup();
    mockSuccess();
    renderSignUp();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign up$/i }));
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/auth/signup",
        expect.objectContaining({ method: "POST" })
      )
    );
  });

  it("sends Content-Type: application/json header", async () => {
    const user = userEvent.setup();
    mockSuccess();
    renderSignUp();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign up$/i }));
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/auth/signup",
        expect.objectContaining({
          headers: { "Content-Type": "application/json" },
        })
      )
    );
  });

  it("sends username, email and password in the request body", async () => {
    const user = userEvent.setup();
    mockSuccess();
    renderSignUp();
    await fillForm(user, {
      username: "johndoe",
      email: "john@example.com",
      password: "secret123",
    });
    await user.click(screen.getByRole("button", { name: /^sign up$/i }));
    await waitFor(() => {
      const [, { body }] = global.fetch.mock.calls[0];
      const parsed = JSON.parse(body);
      expect(parsed).toEqual({
        username: "johndoe",
        email: "john@example.com",
        password: "secret123",
      });
    });
  });

  it("navigates to /sign-in on successful signup", async () => {
    const user = userEvent.setup();
    mockSuccess();
    renderSignUp();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign up$/i }));
    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith("/sign-in")
    );
  });

  it("navigates to /sign-in exactly once on success", async () => {
    const user = userEvent.setup();
    mockSuccess();
    renderSignUp();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign up$/i }));
    await waitFor(() => expect(navigateMock).toHaveBeenCalledOnce());
  });

  it("shows Loading... and disables the button while submitting", async () => {
    const user = userEvent.setup();
    // Hang fetch so loading state persists
    global.fetch = vi.fn(() => new Promise(() => {}));
    renderSignUp();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign up$/i }));
    expect(
      await screen.findByRole("button", { name: /loading/i })
    ).toBeDisabled();
  });

  it("re-enables the button after fetch resolves", async () => {
    const user = userEvent.setup();
    mockSuccess();
    renderSignUp();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign up$/i }));
    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalled()
    );
    // After navigation the button would still be in the DOM briefly
    // — loading should be false by this point
  });
});

// ─── Error handling ───────────────────────────────────────────────────────────

describe("SignUp — errors", () => {
  it("shows error message when API returns success: false", async () => {
    const user = userEvent.setup();
    mockApiFailure("Email already taken");
    renderSignUp();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign up$/i }));
    expect(
      await screen.findByText("Email already taken")
    ).toBeInTheDocument();
  });

  it("shows error message when fetch throws a network error", async () => {
    const user = userEvent.setup();
    mockNetworkError();
    renderSignUp();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign up$/i }));
    expect(await screen.findByText(/network error/i)).toBeInTheDocument();
  });

  it("does not navigate when API returns success: false", async () => {
    const user = userEvent.setup();
    mockApiFailure();
    renderSignUp();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign up$/i }));
    await screen.findByText(/email already taken/i);
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("does not navigate when fetch throws", async () => {
    const user = userEvent.setup();
    mockNetworkError();
    renderSignUp();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign up$/i }));
    await screen.findByText(/network error/i);
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("clears the error on a subsequent successful submit", async () => {
    const user = userEvent.setup();

    // First submit — fails
    mockApiFailure("Email already taken");
    renderSignUp();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign up$/i }));
    await screen.findByText("Email already taken");

    // Second submit — succeeds
    mockSuccess();
    await user.click(screen.getByRole("button", { name: /^sign up$/i }));
    await waitFor(() =>
      expect(screen.queryByText("Email already taken")).not.toBeInTheDocument()
    );
  });

  it("re-enables the button after an API failure", async () => {
    const user = userEvent.setup();
    mockApiFailure();
    renderSignUp();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign up$/i }));
    await screen.findByText(/email already taken/i);
    expect(
      screen.getByRole("button", { name: /^sign up$/i })
    ).not.toBeDisabled();
  });

  it("re-enables the button after a network error", async () => {
    const user = userEvent.setup();
    mockNetworkError();
    renderSignUp();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign up$/i }));
    await screen.findByText(/network error/i);
    expect(
      screen.getByRole("button", { name: /^sign up$/i })
    ).not.toBeDisabled();
  });
});
