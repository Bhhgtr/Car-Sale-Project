import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import OAuth from "../../components/OAuth";

// ─── Hoisted mocks ────────────────────────────────────────────────────────────
// vi.mock() calls are hoisted to the top of the file by Vitest BEFORE any
// const/let declarations are evaluated. This means a plain:
//
//   const signInWithPopupMock = vi.fn();
//   vi.mock('@firebase/auth', () => ({ signInWithPopup: signInWithPopupMock }))
//
// fails with "Cannot access before initialization" because the const hasn't
// run yet when the factory executes.
//
// vi.hoisted() solves this — its callback is also hoisted, so it runs in the
// same elevated scope as the vi.mock factories, making the refs available to both.

const { signInWithPopupMock, navigateMock } = vi.hoisted(() => ({
  signInWithPopupMock: vi.fn(),
  navigateMock: vi.fn(),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("@firebase/auth", () => ({
  GoogleAuthProvider: vi.fn(function () {}),
  getAuth: vi.fn(() => "mock-auth-instance"),
  signInWithPopup: signInWithPopupMock,
}));

vi.mock("../firebase", () => ({ app: "mock-app" }));

// ─── Redux store ──────────────────────────────────────────────────────────────

const buildStore = () =>
  configureStore({
    reducer: {
      user: (state = { currentUser: null, error: null, loading: null }) =>
        state,
    },
  });

// ─── Render helper ────────────────────────────────────────────────────────────

const renderOAuth = () => {
  const store = buildStore();
  render(
    <Provider store={store}>
      <MemoryRouter>
        <OAuth />
      </MemoryRouter>
    </Provider>
  );
  return { store };
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockGoogleResult = {
  user: {
    displayName: "John Doe",
    email: "john@gmail.com",
    photoURL: "https://example.com/photo.jpg",
  },
};

const mockApiResponse = {
  _id: "user123",
  username: "johndoe",
  email: "john@gmail.com",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockHappyPath = () => {
  signInWithPopupMock.mockResolvedValue(mockGoogleResult);
  global.fetch = vi.fn().mockResolvedValue({
    json: vi.fn().mockResolvedValue(mockApiResponse),
  });
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
});

// ─── Rendering ────────────────────────────────────────────────────────────────

describe("OAuth — rendering", () => {
  it("renders the Google sign-in button", () => {
    renderOAuth();
    expect(
      screen.getByRole("button", { name: /continue with google/i })
    ).toBeInTheDocument();
  });

  it("button has type='button' to prevent accidental form submission", () => {
    renderOAuth();
    const btn = screen.getByRole("button", { name: /continue with google/i });
    expect(btn).toHaveAttribute("type", "button");
  });
});

// ─── Firebase call ────────────────────────────────────────────────────────────

describe("OAuth — Firebase interaction", () => {
  it("calls signInWithPopup when the button is clicked", async () => {
    const user = userEvent.setup();
    mockHappyPath();
    renderOAuth();
    await user.click(screen.getByRole("button", { name: /continue with google/i }));
    expect(signInWithPopupMock).toHaveBeenCalledOnce();
  });

  it("passes a GoogleAuthProvider instance to signInWithPopup", async () => {
    const user = userEvent.setup();
    mockHappyPath();

    const { GoogleAuthProvider } = await import("@firebase/auth");
    renderOAuth();
    await user.click(screen.getByRole("button", { name: /continue with google/i }));

    const [, providerArg] = signInWithPopupMock.mock.calls[0];
    expect(providerArg).toBeInstanceOf(GoogleAuthProvider);
  });

  it("passes the auth instance from getAuth to signInWithPopup", async () => {
    const user = userEvent.setup();
    mockHappyPath();
    renderOAuth();
    await user.click(screen.getByRole("button", { name: /continue with google/i }));

    const [authArg] = signInWithPopupMock.mock.calls[0];
    expect(authArg).toBe("mock-auth-instance");
  });
});

// ─── Fetch call ───────────────────────────────────────────────────────────────

describe("OAuth — API fetch", () => {
  it("POSTs to /api/auth/google after Firebase resolves", async () => {
    const user = userEvent.setup();
    mockHappyPath();
    renderOAuth();
    await user.click(screen.getByRole("button", { name: /continue with google/i }));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/auth/google",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("sends Content-Type: application/json header", async () => {
    const user = userEvent.setup();
    mockHappyPath();
    renderOAuth();
    await user.click(screen.getByRole("button", { name: /continue with google/i }));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/auth/google",
      expect.objectContaining({
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  it("sends displayName, email, and photoURL from the Google result in the body", async () => {
    const user = userEvent.setup();
    mockHappyPath();
    renderOAuth();
    await user.click(screen.getByRole("button", { name: /continue with google/i }));

    const [, { body }] = global.fetch.mock.calls[0];
    const parsed = JSON.parse(body);

    expect(parsed).toEqual({
      name: "John Doe",
      email: "john@gmail.com",
      photo: "https://example.com/photo.jpg",
    });
  });
});

// ─── Success path ─────────────────────────────────────────────────────────────

describe("OAuth — success", () => {
  it("dispatches signInSuccess with the API response data", async () => {
    const user = userEvent.setup();
    mockHappyPath();

    // Spy BEFORE render — useDispatch() captures dispatch during render,
    // so a spy attached after render is never seen by the component.
    const store = buildStore();
    const dispatchSpy = vi.spyOn(store, "dispatch");

    render(
      <Provider store={store}>
        <MemoryRouter>
          <OAuth />
        </MemoryRouter>
      </Provider>
    );

    await user.click(screen.getByRole("button", { name: /continue with google/i }));

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "user/signInSuccess",
        payload: mockApiResponse,
      })
    );
  });

  it("navigates to / after successful sign-in", async () => {
    const user = userEvent.setup();
    mockHappyPath();
    renderOAuth();
    await user.click(screen.getByRole("button", { name: /continue with google/i }));
    expect(navigateMock).toHaveBeenCalledWith("/");
  });

  it("navigates to / exactly once", async () => {
    const user = userEvent.setup();
    mockHappyPath();
    renderOAuth();
    await user.click(screen.getByRole("button", { name: /continue with google/i }));
    expect(navigateMock).toHaveBeenCalledOnce();
  });
});

// ─── Firebase failure ─────────────────────────────────────────────────────────

describe("OAuth — Firebase error", () => {
  beforeEach(() => {
    signInWithPopupMock.mockRejectedValue(new Error("popup-closed-by-user"));
  });

  it("does not call fetch when Firebase throws", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn();
    renderOAuth();
    await user.click(screen.getByRole("button", { name: /continue with google/i }));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("does not navigate when Firebase throws", async () => {
    const user = userEvent.setup();
    renderOAuth();
    await user.click(screen.getByRole("button", { name: /continue with google/i }));
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("logs the error when Firebase throws", async () => {
    const user = userEvent.setup();
    renderOAuth();
    await user.click(screen.getByRole("button", { name: /continue with google/i }));
    expect(console.log).toHaveBeenCalledWith(
      "Couldn't sign in with Google",
      expect.any(Error)
    );
  });
});

// ─── Fetch / API failure ──────────────────────────────────────────────────────

describe("OAuth — fetch error", () => {
  beforeEach(() => {
    signInWithPopupMock.mockResolvedValue(mockGoogleResult);
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
  });

  it("does not dispatch signInSuccess when fetch throws", async () => {
    const user = userEvent.setup();

    const store = buildStore();
    const dispatchSpy = vi.spyOn(store, "dispatch");

    render(
      <Provider store={store}>
        <MemoryRouter>
          <OAuth />
        </MemoryRouter>
      </Provider>
    );

    await user.click(screen.getByRole("button", { name: /continue with google/i }));

    const calls = dispatchSpy.mock.calls.flat();
    const signInSuccessCalled = calls.some(
      (action) => action?.type === "user/signInSuccess"
    );
    expect(signInSuccessCalled).toBe(false);
  });

  it("does not navigate when fetch throws", async () => {
    const user = userEvent.setup();
    renderOAuth();
    await user.click(screen.getByRole("button", { name: /continue with google/i }));
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("logs the error when fetch throws", async () => {
    const user = userEvent.setup();
    renderOAuth();
    await user.click(screen.getByRole("button", { name: /continue with google/i }));
    expect(console.log).toHaveBeenCalledWith(
      "Couldn't sign in with Google",
      expect.any(Error)
    );
  });
});
