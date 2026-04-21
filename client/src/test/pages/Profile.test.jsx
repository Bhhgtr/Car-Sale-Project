import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../../redux/user/userSlice";
import Profile from "../../pages/Profile";

// ─── Env vars ─────────────────────────────────────────────────────────────────

vi.stubEnv("VITE_AWS_BUCKET_NAME", "test-bucket");
vi.stubEnv("VITE_AWS_REGION", "us-east-1");

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockUser = {
  _id: "user123",
  username: "johndoe",
  email: "john@example.com",
  avatar: "https://example.com/avatar.jpg",
};

const mockListings = [
  {
    _id: "l1",
    name: "Ferrari 488",
    imageUrls: ["https://example.com/f1.jpg"],
  },
  {
    _id: "l2",
    name: "Lamborghini Huracan",
    imageUrls: ["https://example.com/l1.jpg"],
  },
];

// ─── Store factories ──────────────────────────────────────────────────────────
// buildStore uses the real userReducer — correct for most tests.
// buildStubStore uses a stub reducer that never nulls currentUser — used for
// delete/signout success tests where the real reducer sets currentUser to null
// and causes a crash on re-render before the component can unmount.

const buildStore = (overrides = {}) =>
  configureStore({
    reducer: { user: userReducer },
    preloadedState: {
      user: {
        currentUser: mockUser,
        loading: false,
        error: null,
        ...overrides,
      },
    },
  });

const buildStubStore = (overrides = {}) =>
  configureStore({
    reducer: {
      user: (
        state = { currentUser: mockUser, loading: false, error: null },
        _action
      ) => ({ ...state, ...overrides }),
    },
  });

// ─── Render helpers ───────────────────────────────────────────────────────────

const renderProfile = (storeOverrides = {}) => {
  const store = buildStore(storeOverrides);
  const dispatchSpy = vi.spyOn(store, "dispatch");
  render(
    <Provider store={store}>
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<Profile />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
  return { store, dispatchSpy };
};

// Used for delete/signout tests where we only care about dispatch calls,
// not the resulting Redux state change.
const renderProfileWithStubStore = () => {
  const store = buildStubStore();
  const dispatchSpy = vi.spyOn(store, "dispatch");
  render(
    <Provider store={store}>
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<Profile />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
  return { store, dispatchSpy };
};

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Rendering ────────────────────────────────────────────────────────────────

describe("Profile — rendering", () => {
  it("renders the Profile heading", () => {
    renderProfile();
    expect(screen.getByRole("heading", { name: /profile/i })).toBeInTheDocument();
  });

  it("renders the username input pre-filled with currentUser.username", () => {
    renderProfile();
    expect(screen.getByPlaceholderText(/username/i)).toHaveValue(mockUser.username);
  });

  it("renders the email input pre-filled with currentUser.email", () => {
    renderProfile();
    expect(screen.getByPlaceholderText(/email/i)).toHaveValue(mockUser.email);
  });

  it("renders the password input empty", () => {
    renderProfile();
    expect(screen.getByPlaceholderText(/password/i)).toHaveValue("");
  });

  it("renders the avatar image with alt text", () => {
    renderProfile();
    expect(screen.getByRole("img", { name: /profile/i })).toBeInTheDocument();
  });

  it("avatar src uses currentUser.avatar when no upload has occurred", () => {
    renderProfile();
    const img = screen.getByRole("img", { name: /profile/i });
    expect(img.getAttribute("src")).toBe(mockUser.avatar);
  });

  it("renders the Create Listing link pointing to /create-listing", () => {
    renderProfile();
    const link = screen.getByRole("link", { name: /create listing/i });
    expect(link.getAttribute("href")).toBe("/create-listing");
  });

  it("renders the Delete account button", () => {
    renderProfile();
    expect(screen.getByText(/delete account/i)).toBeInTheDocument();
  });

  it("renders the Sign out button", () => {
    renderProfile();
    expect(screen.getByText(/sign out/i)).toBeInTheDocument();
  });

  it("renders the Show Listings button", () => {
    renderProfile();
    expect(
      screen.getByRole("button", { name: /show listings/i })
    ).toBeInTheDocument();
  });

  it("disables the Update button when loading is true", () => {
    renderProfile({ loading: true });
    expect(screen.getByRole("button", { name: /loading/i })).toBeDisabled();
  });

  it("shows the redux error message when error exists in state", () => {
    renderProfile({ error: "Something went wrong" });
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });
});

// ─── Update profile ───────────────────────────────────────────────────────────

describe("Profile — update", () => {
  it("dispatches updateUserStart then updateUserSuccess on successful update", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ ...mockUser, username: "john_updated" }),
    });

    const { dispatchSpy } = renderProfile();
    await user.click(screen.getByRole("button", { name: /update/i }));

    await waitFor(() => {
      const types = dispatchSpy.mock.calls.map((c) => c[0]?.type);
      expect(types).toContain("user/updateUserStart");
      expect(types).toContain("user/updateUserSuccess");
    });
  });

  it("shows 'User is updated successfully!' after a successful update", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ ...mockUser }),
    });

    renderProfile();
    await user.click(screen.getByRole("button", { name: /update/i }));

    expect(
      await screen.findByText(/user is updated successfully/i)
    ).toBeInTheDocument();
  });

  it("dispatches updateUserFailure when API returns success: false", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: false, message: "Update failed" }),
    });

    const { dispatchSpy } = renderProfile();
    await user.click(screen.getByRole("button", { name: /update/i }));

    await waitFor(() => {
      const types = dispatchSpy.mock.calls.map((c) => c[0]?.type);
      expect(types).toContain("user/updateUserFailure");
    });
  });

  it("dispatches updateUserFailure when fetch throws", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const { dispatchSpy } = renderProfile();
    await user.click(screen.getByRole("button", { name: /update/i }));

    await waitFor(() => {
      const types = dispatchSpy.mock.calls.map((c) => c[0]?.type);
      expect(types).toContain("user/updateUserFailure");
    });
  });

  it("POSTs to the correct URL with currentUser._id", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ ...mockUser }),
    });

    renderProfile();
    await user.click(screen.getByRole("button", { name: /update/i }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/user/update/${mockUser._id}`,
        expect.objectContaining({ method: "POST" })
      )
    );
  });
});

// ─── Delete account ───────────────────────────────────────────────────────────

describe("Profile — delete account", () => {
  it("dispatches deleteUserStart then deleteUserSuccess on success", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true }),
    });

    // Stub store prevents the null currentUser crash after deleteUserSuccess
    const { dispatchSpy } = renderProfileWithStubStore();
    await user.click(screen.getByText(/delete account/i));

    await waitFor(() => {
      const types = dispatchSpy.mock.calls.map((c) => c[0]?.type);
      expect(types).toContain("user/deleteUserStart");
      expect(types).toContain("user/deleteUserSuccess");
    });
  });

  it("dispatches deleteUserFailure when API returns success: false", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: false, message: "Cannot delete" }),
    });

    const { dispatchSpy } = renderProfile();
    await user.click(screen.getByText(/delete account/i));

    await waitFor(() => {
      const types = dispatchSpy.mock.calls.map((c) => c[0]?.type);
      expect(types).toContain("user/deleteUserFailure");
    });
  });

  it("dispatches deleteUserFailure when fetch throws", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const { dispatchSpy } = renderProfile();
    await user.click(screen.getByText(/delete account/i));

    await waitFor(() => {
      const types = dispatchSpy.mock.calls.map((c) => c[0]?.type);
      expect(types).toContain("user/deleteUserFailure");
    });
  });

  it("sends a DELETE request to the correct URL", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true }),
    });

    // Stub store prevents the null currentUser crash after deleteUserSuccess
    renderProfileWithStubStore();
    await user.click(screen.getByText(/delete account/i));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/user/delete/${mockUser._id}`,
        expect.objectContaining({ method: "DELETE" })
      )
    );
  });
});

// ─── Sign out ─────────────────────────────────────────────────────────────────

describe("Profile — sign out", () => {
  it("dispatches signOutUserStart then signOutUserSuccess on success", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true }),
    });

    // Stub store prevents the null currentUser crash after signOutUserSuccess
    const { dispatchSpy } = renderProfileWithStubStore();
    await user.click(screen.getByText(/sign out/i));

    await waitFor(() => {
      const types = dispatchSpy.mock.calls.map((c) => c[0]?.type);
      expect(types).toContain("user/signOutUserStart");
      expect(types).toContain("user/signOutUserSuccess");
    });
  });

  it("dispatches signOutUserFailure when API returns success: false", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: false, message: "Sign out failed" }),
    });

    const { dispatchSpy } = renderProfile();
    await user.click(screen.getByText(/sign out/i));

    await waitFor(() => {
      const types = dispatchSpy.mock.calls.map((c) => c[0]?.type);
      expect(types).toContain("user/signOutUserFailure");
    });
  });

  it("dispatches signOutUserFailure when fetch throws", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const { dispatchSpy } = renderProfile();
    await user.click(screen.getByText(/sign out/i));

    await waitFor(() => {
      const types = dispatchSpy.mock.calls.map((c) => c[0]?.type);
      expect(types).toContain("user/signOutUserFailure");
    });
  });

  it("fetches /api/auth/signout", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true }),
    });

    // Stub store prevents the null currentUser crash after signOutUserSuccess
    renderProfileWithStubStore();
    await user.click(screen.getByText(/sign out/i));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith("/api/auth/signout")
    );
  });
});

// ─── Show listings ────────────────────────────────────────────────────────────

describe("Profile — show listings", () => {
  it("renders Your Listings heading and listing names on success", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockListings),
    });

    renderProfile();
    await user.click(screen.getByRole("button", { name: /show listings/i }));

    expect(await screen.findByText(/your listings/i)).toBeInTheDocument();
    expect(await screen.findByText("Ferrari 488")).toBeInTheDocument();
    expect(await screen.findByText("Lamborghini Huracan")).toBeInTheDocument();
  });

  it("fetches listings from the correct URL", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockListings),
    });

    renderProfile();
    await user.click(screen.getByRole("button", { name: /show listings/i }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/user/listings/${mockUser._id}`
      )
    );
  });

  it("shows error message when API returns success: false", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: false }),
    });

    renderProfile();
    await user.click(screen.getByRole("button", { name: /show listings/i }));

    expect(await screen.findByText(/error showing listings/i)).toBeInTheDocument();
  });

  it("shows error message when fetch throws", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    renderProfile();
    await user.click(screen.getByRole("button", { name: /show listings/i }));

    expect(await screen.findByText(/error showing listings/i)).toBeInTheDocument();
  });

  it("each listing links to /listing/<id>", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockListings),
    });

    renderProfile();
    await user.click(screen.getByRole("button", { name: /show listings/i }));

    await screen.findByText("Ferrari 488");
    const links = screen.getAllByRole("link", { name: /ferrari 488/i });
    expect(links[0].getAttribute("href")).toBe("/listing/l1");
  });

  it("each listing has an Edit link to /update-listing/<id>", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue([mockListings[0]]),
    });

    renderProfile();
    await user.click(screen.getByRole("button", { name: /show listings/i }));
    await screen.findByText("Ferrari 488");

    const editLink = screen.getByRole("link", { name: /edit/i });
    expect(editLink.getAttribute("href")).toBe("/update-listing/l1");
  });
});

// ─── Delete listing ───────────────────────────────────────────────────────────

describe("Profile — delete listing", () => {
  const setupListings = async (user) => {
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockListings),
    });
    renderProfile();
    await user.click(screen.getByRole("button", { name: /show listings/i }));
    await screen.findByText("Ferrari 488");
  };

  it("removes a listing from the list after successful delete", async () => {
    const user = userEvent.setup();
    await setupListings(user);

    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true }),
    });

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[0]);

    await waitFor(() =>
      expect(screen.queryByText("Ferrari 488")).not.toBeInTheDocument()
    );
    expect(screen.getByText("Lamborghini Huracan")).toBeInTheDocument();
  });

  it("sends DELETE request to the correct listing URL", async () => {
    const user = userEvent.setup();
    await setupListings(user);

    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true }),
    });

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[0]);

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/listing/delete/l1",
        expect.objectContaining({ method: "DELETE" })
      )
    );
  });

  it("keeps the listing in the list when delete returns success: false", async () => {
    const user = userEvent.setup();
    await setupListings(user);

    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: false, message: "Cannot delete" }),
    });

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[0]);

    await waitFor(() =>
      expect(screen.getByText("Ferrari 488")).toBeInTheDocument()
    );
  });
});

// ─── File upload ──────────────────────────────────────────────────────────────

describe("Profile — file upload", () => {
  it("shows upload error message when presigned URL fetch fails", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ message: "Unauthorized" }),
    });

    renderProfile();

    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(["img"], "avatar.jpg", { type: "image/jpeg" });
    await user.upload(fileInput, file);

    expect(
      await screen.findByText(/error image upload/i)
    ).toBeInTheDocument();
  });

  it("shows 'Image successfully uploaded!' after a successful upload", async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          url: "https://s3.amazonaws.com/upload",
          key: "avatars/avatar.jpg",
        }),
      })
      .mockResolvedValueOnce({ ok: true });

    renderProfile();

    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(["img"], "avatar.jpg", { type: "image/jpeg" });
    await user.upload(fileInput, file);

    expect(
      await screen.findByText(/image successfully uploaded/i)
    ).toBeInTheDocument();
  });
});
