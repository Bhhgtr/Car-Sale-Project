import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "../../pages/Home";

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("swiper/react", () => ({
  Swiper: ({ children }) => <div data-testid="swiper">{children}</div>,
  SwiperSlide: ({ children }) => <div data-testid="swiper-slide">{children}</div>,
}));
vi.mock("swiper", () => ({ default: { use: vi.fn() } }));
vi.mock("swiper/modules", () => ({ Navigation: {} }));
vi.mock("swiper/css/bundle", () => ({}));

// ListingItem is already unit-tested — render a minimal stand-in that exposes
// the listing name so we can assert on how many items appeared and which ones.
vi.mock("../../components/ListingItem", () => ({
  default: ({ listing }) => (
    <div data-testid="listing-item">{listing.name}</div>
  ),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeListing = (id, name, overrides = {}) => ({
  _id: id,
  name,
  address: "Colombo",
  description: "A great car",
  imageUrls: [`https://example.com/${id}.jpg`],
  regularPrice: 1000000,
  discountPrice: 0,
  offer: false,
  type: "sale",
  engine: "2.0L",
  yom: "2020",
  fuelType: "petrol",
  userRef: "user123",
  ...overrides,
});

const offerListings = [
  makeListing("o1", "Offer Car One", { offer: true }),
  makeListing("o2", "Offer Car Two", { offer: true }),
];

const rentListings = [
  makeListing("r1", "Rent Car One", { type: "rent" }),
  makeListing("r2", "Rent Car Two", { type: "rent" }),
];

const saleListings = [
  makeListing("s1", "Sale Car One", { type: "sale" }),
  makeListing("s2", "Sale Car Two", { type: "sale" }),
];

// ─── Render helper ────────────────────────────────────────────────────────────

const renderHome = () =>
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );

// ─── Fetch mock helpers ───────────────────────────────────────────────────────
// Home chains three fetches in sequence: offers → rent → sale.
// mockResolvedValueOnce ensures each sequential call returns the right data.

const mockAllFetches = (
  offers = offerListings,
  rent = rentListings,
  sale = saleListings
) => {
  global.fetch = vi.fn()
    .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue(offers) })
    .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue(rent) })
    .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue(sale) });
};

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Hero section ─────────────────────────────────────────────────────────────

describe("Home — hero", () => {
  beforeEach(() => mockAllFetches());

  it("renders the tagline text", () => {
    renderHome();
    expect(screen.getByText(/exotic cars is the best place/i)).toBeInTheDocument();
  });

  it("renders the Let's get started link pointing to /search", () => {
    renderHome();
    const link = screen.getByRole("link", { name: /let's get started/i });
    expect(link).toBeInTheDocument();
    expect(link.getAttribute("href")).toBe("/search");
  });
});

// ─── Fetch sequence ───────────────────────────────────────────────────────────

describe("Home — fetch sequence", () => {
  it("fetches offer listings first", async () => {
    mockAllFetches();
    renderHome();
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/listing/get?offer=true&limit=4"
      )
    );
  });

  it("fetches rent listings after offers resolve", async () => {
    mockAllFetches();
    renderHome();
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/listing/get?type=rent&limit=4"
      )
    );
  });

  it("fetches sale listings after rent resolves", async () => {
    mockAllFetches();
    renderHome();
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/listing/get?type=sale&limit=4"
      )
    );
  });

  it("makes exactly 3 fetch calls in total", async () => {
    mockAllFetches();
    renderHome();
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(3));
  });
});

// ─── Offer listings section ───────────────────────────────────────────────────

describe("Home — offer listings", () => {
  it("renders the Recent offers heading when offer listings exist", async () => {
    mockAllFetches();
    renderHome();
    expect(await screen.findByText(/recent offers/i)).toBeInTheDocument();
  });

  it("renders a ListingItem for each offer listing", async () => {
    mockAllFetches();
    renderHome();
    expect(await screen.findByText("Offer Car One")).toBeInTheDocument();
    expect(await screen.findByText("Offer Car Two")).toBeInTheDocument();
  });

  it("renders the Show more offers link pointing to /search?offer=true", async () => {
    mockAllFetches();
    renderHome();
    const link = await screen.findByRole("link", { name: /show more offers/i });
    expect(link.getAttribute("href")).toBe("/search?offer=true");
  });

  it("does not render the Recent offers section when offer listings are empty", async () => {
    mockAllFetches([], rentListings, saleListings);
    renderHome();
    await screen.findByText(/recent vehicles for rent/i);
    expect(screen.queryByText(/recent offers/i)).not.toBeInTheDocument();
  });
});

// ─── Rent listings section ────────────────────────────────────────────────────

describe("Home — rent listings", () => {
  it("renders the Recent vehicles for rent heading when rent listings exist", async () => {
    mockAllFetches();
    renderHome();
    expect(
      await screen.findByText(/recent vehicles for rent/i)
    ).toBeInTheDocument();
  });

  it("renders a ListingItem for each rent listing", async () => {
    mockAllFetches();
    renderHome();
    expect(await screen.findByText("Rent Car One")).toBeInTheDocument();
    expect(await screen.findByText("Rent Car Two")).toBeInTheDocument();
  });

  it("renders the Show more vehicles for rent link pointing to /search?type=rent", async () => {
    mockAllFetches();
    renderHome();
    const link = await screen.findByRole("link", {
      name: /show more vehicles for rent/i,
    });
    expect(link.getAttribute("href")).toBe("/search?type=rent");
  });

  it("does not render the rent section when rent listings are empty", async () => {
    mockAllFetches(offerListings, [], saleListings);
    renderHome();
    await screen.findByText(/recent vehicles for sale/i);
    expect(
      screen.queryByText(/recent vehicles for rent/i)
    ).not.toBeInTheDocument();
  });
});

// ─── Sale listings section ────────────────────────────────────────────────────

describe("Home — sale listings", () => {
  it("renders the Recent vehicles for sale heading when sale listings exist", async () => {
    mockAllFetches();
    renderHome();
    expect(
      await screen.findByText(/recent vehicles for sale/i)
    ).toBeInTheDocument();
  });

  it("renders a ListingItem for each sale listing", async () => {
    mockAllFetches();
    renderHome();
    expect(await screen.findByText("Sale Car One")).toBeInTheDocument();
    expect(await screen.findByText("Sale Car Two")).toBeInTheDocument();
  });

  it("renders the Show more vehicles for sale link pointing to /search?type=sale", async () => {
    mockAllFetches();
    renderHome();
    const link = await screen.findByRole("link", {
      name: /show more vehicles for sale/i,
    });
    expect(link.getAttribute("href")).toBe("/search?type=sale");
  });

  it("does not render the sale section when sale listings are empty", async () => {
    mockAllFetches(offerListings, rentListings, []);
    renderHome();
    await screen.findByText(/recent vehicles for rent/i);
    expect(
      screen.queryByText(/recent vehicles for sale/i)
    ).not.toBeInTheDocument();
  });
});

// ─── Swiper ───────────────────────────────────────────────────────────────────

describe("Home — swiper", () => {
  it("renders one swiper slide per offer listing", async () => {
    mockAllFetches();
    renderHome();
    await screen.findByText(/recent offers/i);
    const slides = screen.getAllByTestId("swiper-slide");
    expect(slides).toHaveLength(offerListings.length);
  });

  it("renders no swiper slides when offer listings are empty", async () => {
    mockAllFetches([], rentListings, saleListings);
    renderHome();
    await screen.findByText(/recent vehicles for rent/i);
    expect(screen.queryAllByTestId("swiper-slide")).toHaveLength(0);
  });
});

// ─── Error handling ───────────────────────────────────────────────────────────

describe("Home — error handling", () => {

  it("renders no listing sections when all fetches fail", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    renderHome();
    // Give async effects time to settle
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/recent offers/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/recent vehicles for rent/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/recent vehicles for sale/i)).not.toBeInTheDocument();
  });

  it("does not crash when offer fetch fails — page still mounts", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    expect(() => renderHome()).not.toThrow();
  });
});
