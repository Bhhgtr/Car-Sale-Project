import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import Listing from "../../pages/Listing";

// ─── Module mocks ─────────────────────────────────────────────────────────────

// Swiper has no jsdom-compatible rendering — mock the whole module so
// it just renders children without any carousel logic.
vi.mock("swiper/react", () => ({
  Swiper: ({ children }) => <div data-testid="swiper">{children}</div>,
  SwiperSlide: ({ children }) => <div data-testid="swiper-slide">{children}</div>,
}));
vi.mock("swiper", () => ({ default: { use: vi.fn() } }));
vi.mock("swiper/modules", () => ({ Navigation: {} }));
vi.mock("swiper/css/bundle", () => ({}));

// Contact is already unit-tested — mock it here to isolate Listing's own logic.
vi.mock("../../components/Contact", () => ({
  default: ({ listing }) => (
    <div data-testid="contact-component">Contact: {listing.name}</div>
  ),
}));

// ─── Redux store factory ───────────────────────────────────────────────────────

const buildStore = (currentUser = null) =>
  configureStore({
    reducer: { user: () => ({ currentUser }) },
  });

// ─── Render helper ────────────────────────────────────────────────────────────
// Mount at /listing/:listingId so useParams() resolves correctly.

const renderListing = (currentUser = null, listingId = "listing123") =>
  render(
    <Provider store={buildStore(currentUser)}>
      <MemoryRouter initialEntries={[`/listing/${listingId}`]}>
        <Routes>
          <Route path="/listing/:listingId" element={<Listing />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockUser = { _id: "user123", username: "johndoe" };
const otherUser = { _id: "other456", username: "janedoe" };

const mockListing = {
  _id: "listing123",
  name: "Ferrari 488 GTB",
  address: "42 Maranello Drive, Colombo",
  description: "A mid-engine sports car with a twin-turbocharged V8.",
  imageUrls: [
    "https://example.com/ferrari1.jpg",
    "https://example.com/ferrari2.jpg",
  ],
  regularPrice: 15000000,
  discountPrice: 500000,
  offer: false,
  type: "sale",
  engine: "3.9L V8 Twin-Turbo",
  yom: "2021",
  fuelType: "petrol",
  userRef: "owner789",
};

// ─── Fetch helpers ────────────────────────────────────────────────────────────

const mockFetchSuccess = (data = mockListing) => {
  global.fetch = vi.fn().mockResolvedValue({
    json: vi.fn().mockResolvedValue(data),
  });
};

const mockFetchApiFailure = () => {
  global.fetch = vi.fn().mockResolvedValue({
    json: vi.fn().mockResolvedValue({ success: false, message: "Not found" }),
  });
};

const mockFetchNetworkError = () => {
  global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
};

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  // clipboard API not available in jsdom by default
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ─── Loading state ────────────────────────────────────────────────────────────

describe("Listing — loading", () => {
  it("shows Loading... while fetch is pending", async () => {
    global.fetch = vi.fn(() => new Promise(() => {})); // never resolves
    renderListing();
    expect(await screen.findByText(/loading\.\.\./i)).toBeInTheDocument();
  });

  it("hides Loading... once fetch resolves", async () => {
    mockFetchSuccess();
    renderListing();
    await waitFor(() =>
      expect(screen.queryByText(/loading\.\.\./i)).not.toBeInTheDocument()
    );
  });
});

// ─── Error state ──────────────────────────────────────────────────────────────

describe("Listing — error", () => {
  it("shows error message when API returns success: false", async () => {
    mockFetchApiFailure();
    renderListing();
    expect(
      await screen.findByText(/something went wrong/i)
    ).toBeInTheDocument();
  });

  it("shows error message when fetch throws a network error", async () => {
    mockFetchNetworkError();
    renderListing();
    expect(
      await screen.findByText(/something went wrong/i)
    ).toBeInTheDocument();
  });

  it("does not render listing content when API returns success: false", async () => {
    mockFetchApiFailure();
    renderListing();
    await screen.findByText(/something went wrong/i);
    expect(screen.queryByText("Ferrari 488 GTB")).not.toBeInTheDocument();
  });
});

// ─── Fetch and URL ────────────────────────────────────────────────────────────

describe("Listing — fetch", () => {
  it("fetches from the correct URL using the listingId param", async () => {
    mockFetchSuccess();
    renderListing(null, "abc999");
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith("/api/listing/get/abc999")
    );
  });
});

// ─── Listing content ──────────────────────────────────────────────────────────

describe("Listing — content", () => {
  beforeEach(() => mockFetchSuccess());

  it("renders the listing name", async () => {
    renderListing();
    expect(await screen.findByText(/ferrari 488 gtb/i)).toBeInTheDocument();
  });

  it("renders the listing address", async () => {
    renderListing();
    expect(
      await screen.findByText(/42 maranello drive, colombo/i)
    ).toBeInTheDocument();
  });

  it("renders the listing description", async () => {
    renderListing();
    expect(
      await screen.findByText(/twin-turbocharged V8/i)
    ).toBeInTheDocument();
  });

  it("renders the engine detail", async () => {
    renderListing();
    expect(await screen.findByText(/3\.9L V8 Twin-Turbo/i)).toBeInTheDocument();
  });

  it("renders the year of manufacture", async () => {
    renderListing();
    expect(await screen.findByText(/2021/)).toBeInTheDocument();
  });

  it("capitalises the fuelType", async () => {
    renderListing();
    expect(await screen.findByText("Petrol")).toBeInTheDocument();
  });

  it("renders images in the swiper", async () => {
    renderListing();
    await screen.findByTestId("swiper");
    const slides = await screen.findAllByTestId("swiper-slide");
    expect(slides).toHaveLength(mockListing.imageUrls.length);
  });
});

// ─── Type and offer badges ────────────────────────────────────────────────────

describe("Listing — badges", () => {
  it("shows For Sale badge when type is sale", async () => {
    mockFetchSuccess({ ...mockListing, type: "sale" });
    renderListing();
    expect(await screen.findByText("For Sale")).toBeInTheDocument();
  });

  it("shows For Rent badge when type is rent", async () => {
    mockFetchSuccess({ ...mockListing, type: "rent" });
    renderListing();
    expect(await screen.findByText("For Rent")).toBeInTheDocument();
  });

  it("shows discount badge when offer is true", async () => {
    mockFetchSuccess({ ...mockListing, offer: true, discountPrice: 500000 });
    renderListing();
    expect(await screen.findByText(/500,000.*discount/i)).toBeInTheDocument();
  });

  it("does not show discount badge when offer is false", async () => {
    mockFetchSuccess({ ...mockListing, offer: false });
    renderListing();
    await screen.findByText("For Sale"); // wait for render
    expect(screen.queryByText(/discount/i)).not.toBeInTheDocument();
  });
});

// ─── Price rendering ──────────────────────────────────────────────────────────

describe("Listing — price", () => {
  it("shows regularPrice when there is no offer", async () => {
    mockFetchSuccess({ ...mockListing, offer: false, regularPrice: 15000000 });
    renderListing();
    await screen.findByText(/ferrari/i);
    // regularPrice is formatted with toLocaleString — assert on presence of digits
    expect(screen.getByText(/15,000,000/)).toBeInTheDocument();
  });

  it("shows regularPrice minus discountPrice when offer is active", async () => {
    mockFetchSuccess({
      ...mockListing,
      offer: true,
      regularPrice: 15000000,
      discountPrice: 500000,
    });
    renderListing();
    // 15000000 - 500000 = 14500000 — rendered as plain number (no toLocaleString)
    expect(await screen.findByText(/14500000/)).toBeInTheDocument();
  });

  it("appends / month when type is rent", async () => {
    mockFetchSuccess({ ...mockListing, type: "rent" });
    renderListing();
    expect(await screen.findByText(/\/ month/i)).toBeInTheDocument();
  });

  it("does not append / month when type is sale", async () => {
    mockFetchSuccess({ ...mockListing, type: "sale" });
    renderListing();
    await screen.findByText(/ferrari/i);
    expect(screen.queryByText(/\/ month/i)).not.toBeInTheDocument();
  });
});

// ─── Contact Owner button ─────────────────────────────────────────────────────

describe("Listing — Contact Owner button", () => {
  it("shows Contact Owner button when logged in and not the owner", async () => {
    // currentUser._id (user123) !== listing.userRef (owner789)
    mockFetchSuccess({ ...mockListing, userRef: "owner789" });
    renderListing(mockUser);
    expect(
      await screen.findByRole("button", { name: /contact owner/i })
    ).toBeInTheDocument();
  });

  it("hides Contact Owner button when currentUser is the listing owner", async () => {
    // currentUser._id matches listing.userRef
    mockFetchSuccess({ ...mockListing, userRef: mockUser._id });
    renderListing(mockUser);
    await screen.findByText(/ferrari/i);
    expect(
      screen.queryByRole("button", { name: /contact owner/i })
    ).not.toBeInTheDocument();
  });

  it("hides Contact Owner button when not logged in", async () => {
    mockFetchSuccess();
    renderListing(null); // no currentUser
    await screen.findByText(/ferrari/i);
    expect(
      screen.queryByRole("button", { name: /contact owner/i })
    ).not.toBeInTheDocument();
  });

  it("renders the Contact component after clicking Contact Owner", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockFetchSuccess({ ...mockListing, userRef: "owner789" });
    renderListing(mockUser);

    await user.click(
      await screen.findByRole("button", { name: /contact owner/i })
    );

    expect(screen.getByTestId("contact-component")).toBeInTheDocument();
  });

  it("hides the Contact Owner button after it is clicked", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockFetchSuccess({ ...mockListing, userRef: "owner789" });
    renderListing(mockUser);

    await user.click(
      await screen.findByRole("button", { name: /contact owner/i })
    );

    expect(
      screen.queryByRole("button", { name: /contact owner/i })
    ).not.toBeInTheDocument();
  });
});

// ─── Copy link ────────────────────────────────────────────────────────────────

describe("Listing — copy link", () => {
  it("shows 'Link copied!' after clicking the share icon", async () => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  mockFetchSuccess();
  renderListing();

  await screen.findByText(/ferrari/i);

  const shareButton = document.querySelector(".cursor-pointer svg");
  await user.click(shareButton);

  expect(screen.getByText(/link copied!/i)).toBeInTheDocument();
});

it("hides 'Link copied!' after 2 seconds", async () => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  mockFetchSuccess();
  renderListing();

  await screen.findByText(/ferrari/i);

  const shareButton = document.querySelector(".cursor-pointer svg");
  await user.click(shareButton);

  expect(screen.getByText(/link copied!/i)).toBeInTheDocument();

  act(() => vi.advanceTimersByTime(2000));

  await waitFor(() =>
    expect(screen.queryByText(/link copied!/i)).not.toBeInTheDocument()
  );
});
});
