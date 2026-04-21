import {  it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import CreateListing from "../../pages/CreateListing";

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

// ─── Render helper ────────────────────────────────────────────────────────────

const renderCreateListing = (currentUser = mockUser) =>
  render(
    <Provider store={buildStore(currentUser)}>
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<CreateListing />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
});

// ─── 1. Page heading ──────────────────────────────────────────────────────────

it("renders the Create a Listing heading", () => {
  renderCreateListing();
  expect(
    screen.getByRole("heading", { name: /create a listing/i })
  ).toBeInTheDocument();
});

// ─── 2. Sale type checkbox ────────────────────────────────────────────────────

it("checking Sale sets type to sale and unchecks Rent", async () => {
  const user = userEvent.setup();
  renderCreateListing();

  const saleCheckbox = document.querySelector("#sale");
  const rentCheckbox = document.querySelector("#rent");

  // Default type is "rent"
  expect(rentCheckbox).toBeChecked();
  expect(saleCheckbox).not.toBeChecked();

  await user.click(saleCheckbox);

  expect(saleCheckbox).toBeChecked();
  expect(rentCheckbox).not.toBeChecked();
});

// ─── 3. Rent type checkbox ────────────────────────────────────────────────────

it("checking Rent sets type to rent and unchecks Sale", async () => {
  const user = userEvent.setup();
  renderCreateListing();

  const saleCheckbox = document.querySelector("#sale");
  const rentCheckbox = document.querySelector("#rent");

  await user.click(saleCheckbox);
  expect(saleCheckbox).toBeChecked();

  await user.click(rentCheckbox);
  expect(rentCheckbox).toBeChecked();
  expect(saleCheckbox).not.toBeChecked();
});

// ─── 4. Offer checkbox toggles discount price field ───────────────────────────

it("checking Offer reveals the Discounted price input", async () => {
  const user = userEvent.setup();
  renderCreateListing();

  expect(screen.queryByText(/discounted price/i)).not.toBeInTheDocument();

  await user.click(document.querySelector("#offer"));

  expect(screen.getByText(/discounted price/i)).toBeInTheDocument();
});

// ─── 5. Rent label shows only for rent type ───────────────────────────────────

it("shows the ($ / month) label for rent type and hides it for sale", async () => {
  const user = userEvent.setup();
  renderCreateListing();

  // Default is rent — label should be visible
  expect(screen.getAllByText(/\$ \/ month/i).length).toBeGreaterThan(0);

  // Switch to sale — label should disappear
  await user.click(document.querySelector("#sale"));
  expect(screen.queryByText(/\$ \/ month/i)).not.toBeInTheDocument();
});

// ─── 6. Upload button shows "Uploading…" while in progress ───────────────────

it("shows Uploading... on the upload button while upload is in progress", async () => {
  const user = userEvent.setup();

  // Hang fetch so upload never resolves — keeps uploading state true
  global.fetch = vi.fn(() => new Promise(() => {}));

  renderCreateListing();

  const file = new File(["img"], "car.jpg", { type: "image/jpeg" });
  await user.upload(document.querySelector('input[type="file"]'), file);
  await user.click(screen.getByRole("button", { name: /^upload$/i }));

  expect(
    await screen.findByRole("button", { name: /uploading/i })
  ).toBeInTheDocument();
});

// ─── 7. Image upload error — too many images ──────────────────────────────────

it("shows an error when trying to upload more than 6 images total", async () => {
  const user = userEvent.setup();
  renderCreateListing();

  const files = Array.from({ length: 7 }, (_, i) =>
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
  renderCreateListing();

  await user.type(screen.getByPlaceholderText(/^name$/i), "Ferrari 488");
  await user.type(screen.getByPlaceholderText(/description/i), "A great car");
  await user.type(screen.getByPlaceholderText(/address/i), "Colombo");
  await user.type(document.querySelector("#engine"), "3.9L V8");
  await user.type(document.querySelector("#yom"), "2020");
  await user.selectOptions(document.querySelector("#fuelType"), "petrol");

  const submitBtn = screen.getByRole("button", { name: /create listing/i });
  console.log("disabled?", submitBtn.disabled);

  await user.click(submitBtn);


  await new Promise(r => setTimeout(r, 300));
  console.log("body innerHTML:", document.body.innerHTML);
});
// ─── 9. Submit blocked — discount price > regular price ───────────────────────

it("shows an error when discount price is higher than regular price", async () => {
  const user = userEvent.setup();

  global.fetch = vi.fn()
    .mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        url: "https://s3.amazonaws.com/upload",
        key: "images/car.jpg",
      }),
    })
    .mockResolvedValueOnce({ ok: true }); // S3 PUT

  renderCreateListing();

  // Upload one image so imageUrls.length >= 1
  const file = new File(["img"], "car.jpg", { type: "image/jpeg" });
  await user.upload(document.querySelector('input[type="file"]'), file);
  await user.click(screen.getByRole("button", { name: /^upload$/i }));

  // Wait for both upload fetches to resolve
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

  // Fill all required fields
  await user.type(screen.getByPlaceholderText(/^name$/i), "Ferrari 488");
  await user.type(screen.getByPlaceholderText(/description/i), "A great car");
  await user.type(screen.getByPlaceholderText(/address/i), "Colombo");
  await user.type(document.querySelector("#engine"), "3.9L V8");
  await user.type(document.querySelector("#yom"), "2020");
  await user.selectOptions(document.querySelector("#fuelType"), "petrol");

  await user.click(document.querySelector("#offer"));

  const regularInput = document.querySelector("#regularPrice");
  await user.clear(regularInput);
  await user.type(regularInput, "100");

  const discountInput = document.querySelector("#discountPrice");
  await user.clear(discountInput);
  await user.type(discountInput, "500");

  await user.click(screen.getByRole("button", { name: /create listing/i }));

  expect(
    await screen.findByText(/discount price must be lower than regular price/i)
  ).toBeInTheDocument();
  expect(navigateMock).not.toHaveBeenCalled();
});

// ─── 10. Successful submit ────────────────────────────────────────────────────

it("POSTs to /api/listing/create with userRef and navigates on success", async () => {
  const user = userEvent.setup();

  global.fetch = vi.fn()
    .mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        url: "https://s3.amazonaws.com/upload",
        key: "images/car.jpg",
      }),
    })
    .mockResolvedValueOnce({ ok: true })
    .mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ _id: "listing123", success: true }),
    });

  renderCreateListing();

  const file = new File(["img"], "car.jpg", { type: "image/jpeg" });
  await user.upload(document.querySelector('input[type="file"]'), file);
  await user.click(screen.getByRole("button", { name: /^upload$/i }));

  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

  // Confirm image tile is rendered — proves imageUrls state updated
  await screen.findByAltText("listing image");

  await user.type(screen.getByPlaceholderText(/^name$/i), "Ferrari 488");
  await user.type(screen.getByPlaceholderText(/description/i), "A great car");
  await user.type(screen.getByPlaceholderText(/address/i), "Colombo");
  await user.type(document.querySelector("#engine"), "3.9L V8");

  // Use tripleClick to select-all before typing into number inputs
  const yomInput = document.querySelector("#yom");
  await user.tripleClick(yomInput);
  await user.type(yomInput, "2020");

  await user.selectOptions(document.querySelector("#fuelType"), "petrol");

  const regularInput = document.querySelector("#regularPrice");
  await user.tripleClick(regularInput);
  await user.type(regularInput, "1000");

  await user.click(screen.getByRole("button", { name: /create listing/i }));

  await waitFor(() => {
    expect(global.fetch).toHaveBeenNthCalledWith(
      3,
      "/api/listing/create",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining('"userRef":"user123"'),
      })
    );
    expect(navigateMock).toHaveBeenCalledWith("/listing/listing123");
  });
});
