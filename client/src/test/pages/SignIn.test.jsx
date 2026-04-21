import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../../redux/user/userSlice";
import SignIn from "../../pages/SignIn";

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("../components/OAuth", () => ({
  default: () => <button type="button">Continue with Google</button>,
}));

// ─── Store factory ────────────────────────────────────────────────────────────
// Real userReducer so dispatched actions (signInStart, signInFailure) actually
// update loading and error in state — driving the button and error UI.

const buildStore = () =>
  configureStore({
    reducer: { user: userReducer },
    preloadedState: {
      user: { currentUser: null, loading: false, error: null },
    },
  });

// ─── Render helper ────────────────────────────────────────────────────────────

const renderSignIn = () => {
  const store = buildStore();
  const dispatchSpy = vi.spyOn(store, "dispatch");
  render(
    <Provider store={store}>
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<SignIn />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
  return { store, dispatchSpy };
};

// ─── Fetch helpers ────────────────────────────────────────────────────────────

const mockSuccess = (user = { _id: "u1", username: "johndoe" }) => {
  global.fetch = vi.fn().mockResolvedValue({
    json: vi.fn().mockResolvedValue(user),
  });
};

const mockApiFailure = (message = "Invalid credentials") => {
  global.fetch = vi.fn().mockResolvedValue({
    json: vi.fn().mockResolvedValue({ success: false, message }),
  });
};

const mockNetworkError = () => {
  global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
};

// ─── Form fill helper ─────────────────────────────────────────────────────────

const fillForm = async (user, {
  email = "john@example.com",
  password = "secret123",
} = {}) => {
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

describe("SignIn — rendering", () => {
  it("renders the Sign In heading", () => {
    renderSignIn();
    expect(
      screen.getByRole("heading", { name: /sign in/i })
    ).toBeInTheDocument();
  });

  it("renders the email input", () => {
    renderSignIn();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  });

  it("renders the password input", () => {
    renderSignIn();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  it("renders the Sign In submit button", () => {
    renderSignIn();
    expect(
      screen.getByRole("button", { name: /^sign in$/i })
    ).toBeInTheDocument();
  });

  it("renders the OAuth button", () => {
    renderSignIn();
    expect(
      screen.getByRole("button", { name: /continue with google/i })
    ).toBeInTheDocument();
  });

  it("renders the Sign up link pointing to /sign-up", () => {
    renderSignIn();
    const link = screen.getByRole("link", { name: /sign up/i });
    expect(link).toBeInTheDocument();
    expect(link.getAttribute("href")).toBe("/sign-up");
  });

  it("submit button is enabled on initial render", () => {
    renderSignIn();
    expect(
      screen.getByRole("button", { name: /^sign in$/i })
    ).not.toBeDisabled();
  });

  it("does not show an error message on initial render", () => {
    renderSignIn();
    expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument();
  });
});

// ─── Controlled inputs ────────────────────────────────────────────────────────

describe("SignIn — inputs", () => {
  it("updates the email input as the user types", async () => {
    const user = userEvent.setup();
    renderSignIn();
    const input = screen.getByPlaceholderText(/email/i);
    await user.type(input, "john@example.com");
    expect(input).toHaveValue("john@example.com");
  });

  it("updates the password input as the user types", async () => {
    const user = userEvent.setup();
    renderSignIn();
    const input = screen.getByPlaceholderText(/password/i);
    await user.type(input, "secret123");
    expect(input).toHaveValue("secret123");
  });
});

// ─── Redux loading state ──────────────────────────────────────────────────────

describe("SignIn — loading state", () => {
  it("disables the button and shows Loading... while fetch is pending", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn(() => new Promise(() => {})); // never resolves
    renderSignIn();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    const btn = await screen.findByRole("button", { name: /loading/i });
    expect(btn).toBeDisabled();
  });

  it("re-enables the button after a successful submit", async () => {
    const user = userEvent.setup();
    mockSuccess();
    renderSignIn();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    await waitFor(() => expect(navigateMock).toHaveBeenCalled());
    // signInSuccess sets loading: false in the reducer
    expect(
      screen.queryByRole("button", { name: /loading/i })
    ).not.toBeInTheDocument();
  });

  it("re-enables the button after an API failure", async () => {
    const user = userEvent.setup();
    mockApiFailure();
    renderSignIn();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    await screen.findByText(/invalid credentials/i);
    expect(
      screen.getByRole("button", { name: /^sign in$/i })
    ).not.toBeDisabled();
  });

  it("re-enables the button after a network error", async () => {
    const user = userEvent.setup();
    mockNetworkError();
    renderSignIn();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    await screen.findByText(/network error/i);
    expect(
      screen.getByRole("button", { name: /^sign in$/i })
    ).not.toBeDisabled();
  });
});

// ─── Form submission ──────────────────────────────────────────────────────────

describe("SignIn — submission", () => {
  it("POSTs to /api/auth/signin on submit", async () => {
    const user = userEvent.setup();
    mockSuccess();
    renderSignIn();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/auth/signin",
        expect.objectContaining({ method: "POST" })
      )
    );
  });

  it("sends Content-Type: application/json header", async () => {
    const user = userEvent.setup();
    mockSuccess();
    renderSignIn();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/auth/signin",
        expect.objectContaining({
          headers: { "Content-Type": "application/json" },
        })
      )
    );
  });

  it("sends email and password in the request body", async () => {
    const user = userEvent.setup();
    mockSuccess();
    renderSignIn();
    await fillForm(user, {
      email: "john@example.com",
      password: "secret123",
    });
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    await waitFor(() => {
      const [, { body }] = global.fetch.mock.calls[0];
      const parsed = JSON.parse(body);
      expect(parsed).toEqual({
        email: "john@example.com",
        password: "secret123",
      });
    });
  });

  it("dispatches signInStart then signInSuccess on success", async () => {
    const user = userEvent.setup();
    mockSuccess();
    const { dispatchSpy } = renderSignIn();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    await waitFor(() => {
      const types = dispatchSpy.mock.calls.map((c) => c[0]?.type);
      expect(types).toContain("user/signInStart");
      expect(types).toContain("user/signInSuccess");
    });
  });

  it("dispatches signInSuccess with the API response data", async () => {
    const user = userEvent.setup();
    const mockUser = { _id: "u1", username: "johndoe", email: "john@example.com" };
    mockSuccess(mockUser);
    const { dispatchSpy } = renderSignIn();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    await waitFor(() =>
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "user/signInSuccess",
          payload: mockUser,
        })
      )
    );
  });

  it("navigates to / on successful sign in", async () => {
    const user = userEvent.setup();
    mockSuccess();
    renderSignIn();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith("/")
    );
  });

  it("navigates to / exactly once on success", async () => {
    const user = userEvent.setup();
    mockSuccess();
    renderSignIn();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    await waitFor(() => expect(navigateMock).toHaveBeenCalledOnce());
  });
});

// ─── Error handling ───────────────────────────────────────────────────────────

describe("SignIn — errors", () => {
  it("dispatches signInFailure when API returns success: false", async () => {
    const user = userEvent.setup();
    mockApiFailure("Invalid credentials");
    const { dispatchSpy } = renderSignIn();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    await waitFor(() => {
      const types = dispatchSpy.mock.calls.map((c) => c[0]?.type);
      expect(types).toContain("user/signInFailure");
    });
  });

  it("dispatches signInFailure with the API error message", async () => {
    const user = userEvent.setup();
    mockApiFailure("Invalid credentials");
    const { dispatchSpy } = renderSignIn();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    await waitFor(() =>
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "user/signInFailure",
          payload: "Invalid credentials",
        })
      )
    );
  });

  it("shows the error message from the API response", async () => {
    const user = userEvent.setup();
    mockApiFailure("Invalid credentials");
    renderSignIn();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    expect(
      await screen.findByText("Invalid credentials")
    ).toBeInTheDocument();
  });

  it("dispatches signInFailure when fetch throws", async () => {
    const user = userEvent.setup();
    mockNetworkError();
    const { dispatchSpy } = renderSignIn();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    await waitFor(() => {
      const types = dispatchSpy.mock.calls.map((c) => c[0]?.type);
      expect(types).toContain("user/signInFailure");
    });
  });

  it("shows the network error message when fetch throws", async () => {
    const user = userEvent.setup();
    mockNetworkError();
    renderSignIn();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    expect(await screen.findByText(/network error/i)).toBeInTheDocument();
  });

  it("does not navigate when API returns success: false", async () => {
    const user = userEvent.setup();
    mockApiFailure();
    renderSignIn();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    await screen.findByText(/invalid credentials/i);
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("does not navigate when fetch throws", async () => {
    const user = userEvent.setup();
    mockNetworkError();
    renderSignIn();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    await screen.findByText(/network error/i);
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("does not dispatch signInSuccess when API returns success: false", async () => {
    const user = userEvent.setup();
    mockApiFailure();
    const { dispatchSpy } = renderSignIn();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    await screen.findByText(/invalid credentials/i);
    const types = dispatchSpy.mock.calls.map((c) => c[0]?.type);
    expect(types).not.toContain("user/signInSuccess");
  });
});
