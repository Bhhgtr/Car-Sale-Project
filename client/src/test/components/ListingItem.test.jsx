import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ListingItem from "../../components/ListingItem";

// ─── Render helper ────────────────────────────────────────────────────────────

const renderListing = (overrides = {}) =>
  render(
    <MemoryRouter>
      <ListingItem listing={{ ...baseListing, ...overrides }} />
    </MemoryRouter>
  );

// ─── Base fixture ─────────────────────────────────────────────────────────────

const baseListing = {
  _id: "abc123",
  name: "Ferrari 488 GTB",
  address: "42 Maranello Drive, Colombo",
  description: "A mid-engine sports car with a twin-turbocharged V8.",
  imageUrls: ["https://example.com/ferrari.jpg"],
  regularPrice: 15000000,
  discountPrice: 500000,
  offer: false,
  type: "sale",
  engine: "3.9L V8 Twin-Turbo",
  yom: "2021",
  fuelType: "petrol",
};

// ─── Basic content ────────────────────────────────────────────────────────────

describe("ListingItem — content", () => {
  it("renders the listing name", () => {
    renderListing();
    expect(screen.getByText("Ferrari 488 GTB")).toBeInTheDocument();
  });

  it("renders the listing address", () => {
    renderListing();
    expect(
      screen.getByText("42 Maranello Drive, Colombo")
    ).toBeInTheDocument();
  });

  it("renders the listing description", () => {
    renderListing();
    expect(
      screen.getByText(/twin-turbocharged V8/i)
    ).toBeInTheDocument();
  });

  it("renders the engine detail", () => {
    renderListing();
    expect(screen.getByText("3.9L V8 Twin-Turbo")).toBeInTheDocument();
  });

  it("renders the year of manufacture", () => {
    renderListing();
    expect(screen.getByText("2021")).toBeInTheDocument();
  });

  it("capitalises the first letter of fuelType", () => {
    renderListing({ fuelType: "petrol" });
    expect(screen.getByText("Petrol")).toBeInTheDocument();
  });

  it("capitalises fuelType correctly for diesel", () => {
    renderListing({ fuelType: "diesel" });
    expect(screen.getByText("Diesel")).toBeInTheDocument();
  });

  it("capitalises fuelType correctly for electric", () => {
    renderListing({ fuelType: "electric" });
    expect(screen.getByText("Electric")).toBeInTheDocument();
  });
});

// ─── Image ────────────────────────────────────────────────────────────────────

describe("ListingItem — image", () => {
  it("renders the cover image with alt text", () => {
    renderListing();
    expect(screen.getByRole("img", { name: /listing cover/i })).toBeInTheDocument();
  });

  it("uses imageUrls[0] as the image src when provided", () => {
    renderListing({ imageUrls: ["https://example.com/ferrari.jpg"] });
    const img = screen.getByRole("img", { name: /listing cover/i });
    expect(img.getAttribute("src")).toBe("https://example.com/ferrari.jpg");
  });

  it("falls back to the default image URL when imageUrls is empty", () => {
    renderListing({ imageUrls: [] });
    const img = screen.getByRole("img", { name: /listing cover/i });
    expect(img.getAttribute("src")).toBe(
      "https://auto.economictimes.indiatimes.com/news/passenger-vehicle/mercedes-benz-india-launches-top-end-amg-glc-43-4matic-coup-and-cle-300-cabriolet-amg-line/112374082"
    );
  });
});

// ─── Link ─────────────────────────────────────────────────────────────────────

describe("ListingItem — link", () => {
  it("wraps the card in a link to /listing/<id>", () => {
    renderListing({ _id: "abc123" });
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/listing/abc123");
  });

  it("uses the correct id when listing._id differs", () => {
    renderListing({ _id: "xyz999" });
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/listing/xyz999");
  });
});

// ─── Price — no offer ─────────────────────────────────────────────────────────

describe("ListingItem — price with no offer", () => {
  it("displays regularPrice when offer is false", () => {
    renderListing({ offer: false, regularPrice: 15000000, type: "sale" });

    const price = screen.getByText(/^\$/, { selector: "p" });
    expect(price).toBeInTheDocument();
    expect(price.textContent).toContain("15");
  });

  it("does not show / month suffix for sale type", () => {
    renderListing({ offer: false, type: "sale" });
    expect(screen.queryByText(/\/ month/i)).not.toBeInTheDocument();
  });
});

// ─── Price — with offer ───────────────────────────────────────────────────────

describe("ListingItem — price with offer", () => {
  it("displays regularPrice minus discountPrice when offer is true", () => {
    renderListing({
      offer: true,
      regularPrice: 15000000,
      discountPrice: 500000,
      type: "sale",
    });
    // Expected: 15000000 - 500000 = 14500000
    const price = screen.getByText(/^\$/, { selector: "p" });
    expect(price.textContent).toContain("14500000");
  });

  it("calculates the discounted price correctly for different values", () => {
    renderListing({
      offer: true,
      regularPrice: 5000000,
      discountPrice: 250000,
      type: "sale",
    });
    // Expected: 5000000 - 250000 = 4750000
    const price = screen.getByText(/^\$/, { selector: "p" });
    expect(price.textContent).toContain("4750000");
  });
});

// ─── Price — rent type ────────────────────────────────────────────────────────

describe("ListingItem — rent type", () => {
  it("appends / month for rent type with no offer", () => {
    renderListing({ type: "rent", offer: false });
    expect(screen.getByText(/\/ month/i)).toBeInTheDocument();
  });

  it("appends / month for rent type even when offer is active", () => {
    renderListing({ type: "rent", offer: true });
    expect(screen.getByText(/\/ month/i)).toBeInTheDocument();
  });

  it("does not append / month for sale type", () => {
    renderListing({ type: "sale", offer: false });
    expect(screen.queryByText(/\/ month/i)).not.toBeInTheDocument();
  });
});
