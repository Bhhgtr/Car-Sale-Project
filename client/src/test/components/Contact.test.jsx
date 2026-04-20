import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Contact from "../../components/Contact";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockListing = {
  userRef: "user123",
  name: "Tesla Model S",
};

const mockOwner = {
  username: "johndoe",
  email: "john@example.com",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const renderContact = (listing = mockListing) =>
  render(
    <MemoryRouter>
      <Contact listing={listing} />
    </MemoryRouter>
  );

const mockFetchSuccess = (data = mockOwner) => {
  global.fetch = vi.fn().mockResolvedValue({
    json: vi.fn().mockResolvedValue(data),
  });
};

const mockFetchFailure = () => {
  global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
};

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Fetch behaviour ──────────────────────────────────────────────────────────

describe("Contact — fetch", () => {
  it("renders nothing before fetch resolves", () => {
    // fetch never resolves during this test
    global.fetch = vi.fn(() => new Promise(() => {}));
    const { container } = renderContact();
    expect(container).toBeEmptyDOMElement();
  });

  it("calls fetch with the correct URL using listing.userRef", async () => {
    mockFetchSuccess();
    renderContact();
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/user/user123");
    });
  });

  it("calls fetch with a different userRef when listing changes", async () => {
    mockFetchSuccess();
    renderContact({ ...mockListing, userRef: "user999" });
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/user/user999");
    });
  });

  it("renders nothing and logs error when fetch fails", async () => {
    mockFetchFailure();
    const { container } = renderContact();
    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(expect.any(Error));
    });
    expect(container).toBeEmptyDOMElement();
  });
});

// ─── Rendering after fetch resolves ───────────────────────────────────────────

describe("Contact — rendering", () => {
  beforeEach(() => mockFetchSuccess());

  it("displays the owner username", async () => {
    renderContact();
    expect(await screen.findByText(/johndoe/i)).toBeInTheDocument();
  });

  it("displays the listing name in lowercase", async () => {
    renderContact();
    expect(await screen.findByText(/tesla model s/i)).toBeInTheDocument();
  });

  it("renders the textarea with empty initial value", async () => {
    renderContact();
    const textarea = await screen.findByPlaceholderText(
      /enter your message here/i
    );
    expect(textarea).toHaveValue("");
  });

  it("renders the Send Message link", async () => {
    renderContact();
    expect(
      await screen.findByRole("link", { name: /send message/i })
    ).toBeInTheDocument();
  });
});

// ─── Textarea interaction ─────────────────────────────────────────────────────

describe("Contact — textarea", () => {
  beforeEach(() => mockFetchSuccess());

  it("updates the textarea value as the user types", async () => {
    const user = userEvent.setup();
    renderContact();
    const textarea = await screen.findByPlaceholderText(
      /enter your message here/i
    );
    await user.type(textarea, "Hello, is this still available?");
    expect(textarea).toHaveValue("Hello, is this still available?");
  });

  it("clears correctly when the user deletes all text", async () => {
    const user = userEvent.setup();
    renderContact();
    const textarea = await screen.findByPlaceholderText(
      /enter your message here/i
    );
    await user.type(textarea, "Some text");
    await user.clear(textarea);
    expect(textarea).toHaveValue("");
  });
});

// ─── Mail to link ──────────────────────────────────────────────────────────────

describe("Contact — mailto link", () => {
  beforeEach(() => mockFetchSuccess());

  it("builds the mailto href with owner email and listing name before any message", async () => {
    renderContact();
    const link = await screen.findByRole("link", { name: /send message/i });
    expect(link.getAttribute("href")).toContain("mailto:john@example.com");
    expect(link.getAttribute("href")).toContain("Tesla Model S");
  });

  it("includes the typed message in the mailto href", async () => {
    const user = userEvent.setup();
    renderContact();
    const textarea = await screen.findByPlaceholderText(
      /enter your message here/i
    );
    await user.type(textarea, "Is this available?");
    const link = screen.getByRole("link", { name: /send message/i });
    expect(link.getAttribute("href")).toContain("Is this available?");
  });
});
