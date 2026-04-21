import { it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import UpdateListing from "../../pages/UpdateListing";

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.stubEnv("VITE_AWS_BUCKET_NAME", "test-bucket");
vi.stubEnv("VITE_AWS_REGION", "us-east-1");

// ─── Redux store ──────────────────────────────────────────────────────────────

const mockUser = { _id: "user123", username: "johndoe" };

const buildStore = (currentUser = mockUser) =>
  configureStore({
    reducer: { user: () => ({ currentUser }) },
  });

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const LISTING_ID = "listing456";

const mockListing = {
  _id: LISTING_ID,
  name: "Ferrari 488",
  description: "A great car",
  address: "Colombo",
  type: "sale",
  engine: "3.9L V8",
  yom: "2021",
  fuelType: "petrol",
  regularPrice: 5000000,
  discountPrice: 0,
  offer: false,
  imageUrls: ["https://example.com/car.jpg"],
};

// ─── Render helper ────────────────────────────────────────────────────────────
// Route must include :listingId so useParams() gets the value the component
// reads for both the initial fetch and the update submit URL.

const renderUpdateListing = (currentUser = mockUser) =>
  render(
    <Provider store={buildStore(currentUser)}>
      <MemoryRouter initialEntries={[`/update-listing/${LISTING_ID}`]}>
        <Routes>
          <Route
            path="/update-listing/:listingId"
            element={<UpdateListing />}
          />
        </Routes>
      </MemoryRouter>
    </Provider>
  );

// ─── fetch mock helpers ───────────────────────────────────────────────────────

// Initial GET for existing listing data
const mockGetListing = (data = mockListing) =>
  vi.fn().mockResolvedValueOnce({
    ok: true,
    json: vi.fn().mockResolvedValue(data),
  });

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
});

// ─── 1. Page heading ──────────────────────────────────────────────────────────

it("renders the Update a Listing heading", async () => {
  global.fetch = mockGetListing();
  renderUpdateListing();
  expect(
    screen.getByRole("heading", { name: /update a listing/i })
  ).toBeInTheDocument();
});

// ─── 2. Pre-fills form with fetched listing data ──────────────────────────────

it("fetches the listing by id and pre-fills the form fields", async () => {
  global.fetch = mockGetListing();
  renderUpdateListing();

  // Wait for the async useEffect fetch to resolve and state to update
  expect(await screen.findByDisplayValue("Ferrari 488")).toBeInTheDocument();
  expect(screen.getByDisplayValue("A great car")).toBeInTheDocument();
  expect(screen.getByDisplayValue("Colombo")).toBeInTheDocument();
  expect(screen.getByDisplayValue("3.9L V8")).toBeInTheDocument();
});

// ─── 3. Fetches from the correct URL using params.listingId ──────────────────

it("calls fetch with the correct listing URL using params.listingId", async () => {
  global.fetch = mockGetListing();
  renderUpdateListing();

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/listing/get/${LISTING_ID}`
    );
  });
});

// ─── 4. Handles data.success === false from the initial fetch ─────────────────

it("logs the error message and does not pre-fill when listing fetch returns success: false", async () => {
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok: true,
    json: vi.fn().mockResolvedValue({
      success: false,
      message: "Listing not found",
    }),
  });

  renderUpdateListing();

  await waitFor(() => {
    expect(console.log).toHaveBeenCalledWith("Listing not found");
  });

  // Form stays at initial empty state — name field should be empty
  expect(screen.getByPlaceholderText(/^name$/i)).toHaveValue("");
});

// ─── 5. Pre-filled image tile renders from fetched imageUrls ──────────────────

it("renders the pre-fetched image tile after listing loads", async () => {
  global.fetch = mockGetListing();
  renderUpdateListing();

  const img = await screen.findByAltText("listing image");
  expect(img).toBeInTheDocument();
  expect(img.getAttribute("src")).toBe("https://example.com/car.jpg");
});

// ─── 6. Upload button shows "Uploading…" while in progress ───────────────────

it("shows Uploading... on the upload button while upload is in progress", async () => {
  const user = userEvent.setup();

  // First call: initial listing GET — resolves normally
  // Subsequent calls: storeImage fetch — hangs forever
  global.fetch = vi.fn()
    .mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(mockListing),
    })
    .mockImplementation(() => new Promise(() => {}));

  renderUpdateListing();
  await screen.findByDisplayValue("Ferrari 488");

  const file = new File(["img"], "car.jpg", { type: "image/jpeg" });
  await user.upload(document.querySelector('input[type="file"]'), file);
  await user.click(screen.getByRole("button", { name: /^upload$/i }));

  expect(
    await screen.findByRole("button", { name: /uploading/i })
  ).toBeInTheDocument();
});

// ─── 7. Image upload error — too many images ──────────────────────────────────

it("shows an error when total images would exceed 6", async () => {
  const user = userEvent.setup();

  // Listing already has 1 image — upload 6 more to hit the limit
  global.fetch = mockGetListing();
  renderUpdateListing();
  await screen.findByDisplayValue("Ferrari 488");

  const files = Array.from({ length: 6 }, (_, i) =>
    new File(["img"], `car${i}.jpg`, { type: "image/jpeg" })
  );

  await user.upload(document.querySelector('input[type="file"]'), files);
  await user.click(screen.getByRole("button", { name: /^upload$/i }));

  expect(
    await screen.findByText(/you can only upload 6 images per listing/i)
  ).toBeInTheDocument();
});

// ─── 8. Submit blocked — no images ───────────────────────────────────────────

it("shows an error and does not navigate when submitted with no images", async () => {
  const user = userEvent.setup();

  // Return a listing with no imageUrls so the form starts empty
  global.fetch = mockGetListing({ ...mockListing, imageUrls: [] });
  renderUpdateListing();
  await screen.findByDisplayValue("Ferrari 488");

  await user.click(screen.getByRole("button", { name: /update listing/i }));

  expect(
    await screen.findByText(/you must upload at least one image/i)
  ).toBeInTheDocument();
  expect(navigateMock).not.toHaveBeenCalled();
});

// ─── 9. Submit blocked — discount price > regular price ───────────────────────

it("shows an error when discount price is higher than regular price", async () => {
  const user = userEvent.setup();
  global.fetch = mockGetListing({ ...mockListing, offer: true });
  renderUpdateListing();
  await screen.findByDisplayValue("Ferrari 488");

  const regularInput = document.querySelector("#regularPrice");
  await user.clear(regularInput);
  await user.type(regularInput, "100");

  const discountInput = document.querySelector("#discountPrice");
  await user.clear(discountInput);
  await user.type(discountInput, "500");

  await user.click(screen.getByRole("button", { name: /update listing/i }));

  expect(
    await screen.findByText(/discount price must be lower than regular price/i)
  ).toBeInTheDocument();
  expect(navigateMock).not.toHaveBeenCalled();
});

// ─── 10. Successful submit ────────────────────────────────────────────────────

it("POSTs to /api/listing/update/:listingId with userRef and navigates on success", async () => {
  const user = userEvent.setup();

  global.fetch = vi.fn()
    // Initial GET
    .mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(mockListing),
    })
    // POST to update
    .mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ _id: LISTING_ID, success: true }),
    });

  renderUpdateListing();

  // Wait for pre-fill — confirms GET resolved and imageUrls is populated
  await screen.findByDisplayValue("Ferrari 488");

  await user.click(screen.getByRole("button", { name: /update listing/i }));

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/listing/update/${LISTING_ID}`,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining('"userRef":"user123"'),
      })
    );
    expect(navigateMock).toHaveBeenCalledWith(`/listing/${LISTING_ID}`);
  });
});
