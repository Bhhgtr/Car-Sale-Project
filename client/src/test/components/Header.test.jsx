import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import Header from "../../components/Header";

// ─── Navigate mock ────────────────────────────────────────────────────────────

const navigateMock = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateMock };
});

// ─── Redux store factory ───────────────────────────────────────────────────────

const buildStore = (currentUser = null) =>
  configureStore({
    reducer: {
      user: () => ({ currentUser }),
    },
  });

// ─── Render helper ────────────────────────────────────────────────────────────

const renderHeader = (currentUser = null, initialPath = "/") =>
  render(
    <Provider store={buildStore(currentUser)}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="*" element={<Header />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockUser = {
  username: "johndoe",
  email: "john@example.com",
  avatar: "https://example.com/avatar.jpg",
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  navigateMock.mockClear();
});

// ─── Navigation links ─────────────────────────────────────────────────────────

describe("Header — navigation links", () => {
  it("renders the ExoticCars logo text", () => {
    renderHeader();
    expect(screen.getByText("Exotic")).toBeInTheDocument();
    expect(screen.getByText("Cars")).toBeInTheDocument();
  });

  it("logo links to /", () => {
    renderHeader();
    const logoLink = screen.getByRole("link", { name: /exotic.*cars/i });
    expect(logoLink.getAttribute("href")).toBe("/");
  });

  it("renders the Home nav link pointing to /", () => {
    renderHeader();
    expect(
      screen.getByRole("link", { name: /home/i }).getAttribute("href")
    ).toBe("/");
  });

  it("renders the About nav link pointing to /about", () => {
    renderHeader();
    expect(
      screen.getByRole("link", { name: /about/i }).getAttribute("href")
    ).toBe("/about");
  });
});

// ─── Auth state — logged out ───────────────────────────────────────────────────

describe("Header — logged out", () => {
  it("shows Sign In link when currentUser is null", () => {
    renderHeader(null);
    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
  });

  it("Sign In link points to /profile", () => {
    renderHeader(null);
    expect(
      screen.getByRole("link", { name: /sign in/i }).getAttribute("href")
    ).toBe("/profile");
  });

  it("does not render a profile image when logged out", () => {
    renderHeader(null);
    expect(
      screen.queryByRole("img", { name: /profile/i })
    ).not.toBeInTheDocument();
  });
});

// ─── Auth state — logged in ────────────────────────────────────────────────────

describe("Header — logged in", () => {
  it("shows profile avatar image when currentUser exists", () => {
    renderHeader(mockUser);
    expect(screen.getByRole("img", { name: /profile/i })).toBeInTheDocument();
  });

  it("avatar src matches currentUser.avatar", () => {
    renderHeader(mockUser);
    const img = screen.getByRole("img", { name: /profile/i });
    expect(img.getAttribute("src")).toBe(mockUser.avatar);
  });

  it("avatar image is wrapped in a link to /profile", () => {
    renderHeader(mockUser);
    const img = screen.getByRole("img", { name: /profile/i });
    expect(img.closest("a").getAttribute("href")).toBe("/profile");
  });

  it("does not show Sign In link when currentUser exists", () => {
    renderHeader(mockUser);
    expect(
      screen.queryByRole("link", { name: /sign in/i })
    ).not.toBeInTheDocument();
  });
});

// ─── Search input ─────────────────────────────────────────────────────────────

describe("Header — search input", () => {
  it("renders the search input", () => {
    renderHeader();
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it("input starts empty on a plain URL", () => {
    renderHeader(null, "/");
    expect(screen.getByPlaceholderText(/search/i)).toHaveValue("");
  });

  it("updates as the user types", async () => {
    const user = userEvent.setup();
    renderHeader();
    const input = screen.getByPlaceholderText(/search/i);
    await user.type(input, "Ferrari");
    expect(input).toHaveValue("Ferrari");
  });

  it("pre-fills from the searchTerm query param in the URL", () => {
    renderHeader(null, "/?searchTerm=Lamborghini");
    expect(screen.getByPlaceholderText(/search/i)).toHaveValue("Lamborghini");
  });

  it("leaves the input empty when the URL has no searchTerm param", () => {
    renderHeader(null, "/?type=sale");
    expect(screen.getByPlaceholderText(/search/i)).toHaveValue("");
  });
});

// ─── Search form submission ────────────────────────────────────────────────────

describe("Header — search form submission", () => {
  it("renders the search submit button", () => {
    renderHeader();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("navigates to /search?searchTerm=<value> on form submit", async () => {
    const user = userEvent.setup();
    renderHeader();
    await user.type(screen.getByPlaceholderText(/search/i), "Ferrari");
    await user.click(screen.getByRole("button"));
    expect(navigateMock).toHaveBeenCalledOnce();
    expect(navigateMock).toHaveBeenCalledWith(
      expect.stringContaining("searchTerm=Ferrari")
    );
    expect(navigateMock).toHaveBeenCalledWith(
      expect.stringContaining("/search?")
    );
  });

  it("navigates with an empty searchTerm when input is blank on submit", async () => {
    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByRole("button"));
    expect(navigateMock).toHaveBeenCalledOnce();
    expect(navigateMock).toHaveBeenCalledWith(
      expect.stringContaining("/search?")
    );
  });

  it("does not navigate on every keystroke — only on submit", async () => {
    const user = userEvent.setup();
    renderHeader();
    await user.type(screen.getByPlaceholderText(/search/i), "BMW");
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
