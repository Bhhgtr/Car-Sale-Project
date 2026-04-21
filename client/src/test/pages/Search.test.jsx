import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Search from "../../pages/Search";

// ─── Module mocks ─────────────────────────────────────────────────────────────

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("../../components/ListingItem", () => ({
  default: ({ listing }) => (
    <div data-testid="listing-item">{listing.name}</div>
  ),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockListings = [
  { _id: "l1", name: "Ferrari 488", imageUrls: ["https://example.com/f1.jpg"], address: "Colombo", description: "Sports car", regularPrice: 5000000, discountPrice: 0, offer: false, type: "sale", engine: "3.9L V8", yom: "2020", fuelType: "petrol", userRef: "u1" },
  { _id: "l2", name: "Toyota Prius", imageUrls: ["https://example.com/t1.jpg"], address: "Kandy", description: "Hybrid", regularPrice: 1000000, discountPrice: 0, offer: false, type: "rent", engine: "1.8L", yom: "2018", fuelType: "petrol", userRef: "u2" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Checkboxes in Search use <input> + <span> siblings with no wrapping <label>,
// so they have no accessible name. Query them by id instead.

const cb = (id) => document.querySelector(`#${id}`);

// ─── Render helper ────────────────────────────────────────────────────────────

const renderSearch = (initialPath = "/search") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/search" element={<Search />} />
      </Routes>
    </MemoryRouter>
  );

// ─── Fetch helpers ────────────────────────────────────────────────────────────

const mockFetchSuccess = (data = mockListings) => {
  global.fetch = vi.fn().mockResolvedValue({
    json: vi.fn().mockResolvedValue(data),
  });
};

const mockFetchPending = () => {
  global.fetch = vi.fn(() => new Promise(() => {}));
};

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  navigateMock.mockClear();
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Rendering — controls ─────────────────────────────────────────────────────

describe("Search — controls render", () => {
  beforeEach(() => mockFetchSuccess([]));

  it("renders the search term input", () => {
    renderSearch();
    expect(screen.getByPlaceholderText(/search\.\.\./i)).toBeInTheDocument();
  });

  it("renders type checkboxes: all, rent, sale, offer", () => {
    renderSearch();
    expect(cb("all")).toBeInTheDocument();
    expect(cb("rent")).toBeInTheDocument();
    expect(cb("sale")).toBeInTheDocument();
    expect(cb("offer")).toBeInTheDocument();
  });

  it("renders fuel type checkboxes: fuelAll, petrol, diesel", () => {
    renderSearch();
    expect(cb("fuelAll")).toBeInTheDocument();
    expect(cb("petrol")).toBeInTheDocument();
    expect(cb("diesel")).toBeInTheDocument();
  });

  it("renders YOM min and max inputs", () => {
    renderSearch();
    expect(screen.getByPlaceholderText(/from/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/to/i)).toBeInTheDocument();
  });

  it("renders the engine input", () => {
    renderSearch();
    expect(screen.getByPlaceholderText(/v6|2\.0l/i)).toBeInTheDocument();
  });

  it("renders the sort dropdown with all options", () => {
    renderSearch();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /price high to low/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /price low to high/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /latest/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Oldest" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /newest model/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Oldest model" })).toBeInTheDocument();
  });

  it("renders the Search submit button", () => {
    renderSearch();
    expect(screen.getByRole("button", { name: /^search$/i })).toBeInTheDocument();
  });

  it("renders the Listing results heading", () => {
    renderSearch();
    expect(screen.getByRole("heading", { name: /listing results/i })).toBeInTheDocument();
  });

  it("'all' checkbox is checked by default (type: all)", () => {
    renderSearch();
    expect(cb("all")).toBeChecked();
  });

  it("'fuelAll' checkbox is checked by default (fuelType: all)", () => {
    renderSearch();
    expect(cb("fuelAll")).toBeChecked();
  });
});

// ─── Fetch on mount ───────────────────────────────────────────────────────────

describe("Search — fetch on mount", () => {
  it("fetches from /api/listing/get on mount", async () => {
    mockFetchSuccess([]);
    renderSearch();
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/listing/get")
      )
    );
  });

  it("fetch is called once on mount", async () => {
    mockFetchSuccess([]);
    renderSearch();
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  });

  it("shows Loading... while fetch is pending", async () => {
    mockFetchPending();
    renderSearch();
    expect(await screen.findByText(/loading\.\.\./i)).toBeInTheDocument();
  });

  it("hides Loading... once fetch resolves", async () => {
    mockFetchSuccess([]);
    renderSearch();
    await waitFor(() =>
      expect(screen.queryByText(/loading\.\.\./i)).not.toBeInTheDocument()
    );
  });
});

// ─── Results panel ────────────────────────────────────────────────────────────

describe("Search — results", () => {
  it("shows 'No listing found!' when listings array is empty", async () => {
    mockFetchSuccess([]);
    renderSearch();
    expect(await screen.findByText(/no listing found/i)).toBeInTheDocument();
  });

  it("renders a ListingItem for each result", async () => {
    mockFetchSuccess(mockListings);
    renderSearch();
    expect(await screen.findByText("Ferrari 488")).toBeInTheDocument();
    expect(await screen.findByText("Toyota Prius")).toBeInTheDocument();
  });

  it("renders the correct number of ListingItems", async () => {
    mockFetchSuccess(mockListings);
    renderSearch();
    await screen.findByText("Ferrari 488");
    expect(screen.getAllByTestId("listing-item")).toHaveLength(mockListings.length);
  });

  it("does not show 'No listing found!' when results exist", async () => {
    mockFetchSuccess(mockListings);
    renderSearch();
    await screen.findByText("Ferrari 488");
    expect(screen.queryByText(/no listing found/i)).not.toBeInTheDocument();
  });
});

// ─── handleChange — type checkboxes ──────────────────────────────────────────

describe("Search — type checkbox interactions", () => {
  beforeEach(() => mockFetchSuccess([]));

  it("clicking rent unchecks all and checks rent", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.click(cb("rent"));
    expect(cb("rent")).toBeChecked();
    expect(cb("all")).not.toBeChecked();
  });

  it("clicking sale unchecks all and checks sale", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.click(cb("sale"));
    expect(cb("sale")).toBeChecked();
    expect(cb("all")).not.toBeChecked();
  });

  it("clicking all after rent unchecks rent and checks all", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.click(cb("rent"));
    await user.click(cb("all"));
    expect(cb("all")).toBeChecked();
    expect(cb("rent")).not.toBeChecked();
  });

  it("clicking offer toggles the offer checkbox on", async () => {
    const user = userEvent.setup();
    renderSearch();
    expect(cb("offer")).not.toBeChecked();
    await user.click(cb("offer"));
    expect(cb("offer")).toBeChecked();
  });

  it("clicking offer twice toggles it back off", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.click(cb("offer"));
    await user.click(cb("offer"));
    expect(cb("offer")).not.toBeChecked();
  });
});

// ─── handleChange — fuel type checkboxes ─────────────────────────────────────

describe("Search — fuel type checkbox interactions", () => {
  beforeEach(() => mockFetchSuccess([]));

  it("clicking petrol unchecks fuelAll and checks petrol", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.click(cb("petrol"));
    expect(cb("petrol")).toBeChecked();
    expect(cb("fuelAll")).not.toBeChecked();
  });

  it("clicking diesel unchecks fuelAll and checks diesel", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.click(cb("diesel"));
    expect(cb("diesel")).toBeChecked();
    expect(cb("fuelAll")).not.toBeChecked();
  });

  it("clicking fuelAll after petrol unchecks petrol and checks fuelAll", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.click(cb("petrol"));
    await user.click(cb("fuelAll"));
    expect(cb("fuelAll")).toBeChecked();
    expect(cb("petrol")).not.toBeChecked();
  });
});

// ─── handleChange — text inputs ───────────────────────────────────────────────

describe("Search — text input interactions", () => {
  beforeEach(() => mockFetchSuccess([]));

  it("typing in the search term input updates its value", async () => {
    const user = userEvent.setup();
    renderSearch();
    const input = screen.getByPlaceholderText(/search\.\.\./i);
    await user.type(input, "BMW");
    expect(input).toHaveValue("BMW");
  });

  it("typing in the engine input updates its value", async () => {
    const user = userEvent.setup();
    renderSearch();
    const input = screen.getByPlaceholderText(/v6|2\.0l/i);
    await user.type(input, "V8");
    expect(input).toHaveValue("V8");
  });

  it("typing in the YOM min input updates its value", async () => {
    const user = userEvent.setup();
    renderSearch();
    const input = screen.getByPlaceholderText(/from/i);
    await user.type(input, "2015");
    expect(input).toHaveValue(2015);
  });

  it("typing in the YOM max input updates its value", async () => {
    const user = userEvent.setup();
    renderSearch();
    const input = screen.getByPlaceholderText(/to/i);
    await user.type(input, "2022");
    expect(input).toHaveValue(2022);
  });
});

// ─── handleChange — sort dropdown ────────────────────────────────────────────

describe("Search — sort dropdown", () => {
  beforeEach(() => mockFetchSuccess([]));

  it("selecting 'Price high to low' sets sort=regularPrice order=desc", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.selectOptions(screen.getByRole("combobox"), "regularPrice_desc");
    expect(screen.getByRole("option", { name: /price high to low/i }).selected).toBe(true);
  });

  it("selecting 'Price low to high' sets sort=regularPrice order=asc", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.selectOptions(screen.getByRole("combobox"), "regularPrice_asc");
    expect(screen.getByRole("option", { name: /price low to high/i }).selected).toBe(true);
  });

  it("selecting 'Newest model' sets sort=yom order=desc", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.selectOptions(screen.getByRole("combobox"), "yom_desc");
    expect(screen.getByRole("option", { name: /newest model/i }).selected).toBe(true);
  });
});

// ─── handleSubmit — navigation ────────────────────────────────────────────────

describe("Search — form submission", () => {
  beforeEach(() => mockFetchSuccess([]));

  it("navigates to /search? with default params on submit with no changes", async () => {
    const user = userEvent.setup();
    renderSearch();
    await screen.findByRole("button", { name: /^search$/i });
    await user.click(screen.getByRole("button", { name: /^search$/i }));
    expect(navigateMock).toHaveBeenCalledOnce();
    expect(navigateMock).toHaveBeenCalledWith(
      expect.stringContaining("/search?")
    );
  });

  it("includes searchTerm in the URL when typed", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.type(screen.getByPlaceholderText(/search\.\.\./i), "Porsche");
    await user.click(screen.getByRole("button", { name: /^search$/i }));
    expect(navigateMock).toHaveBeenCalledWith(
      expect.stringContaining("searchTerm=Porsche")
    );
  });

  it("includes type=rent in the URL when Rent is selected", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.click(cb("rent"));
    await user.click(screen.getByRole("button", { name: /^search$/i }));
    expect(navigateMock).toHaveBeenCalledWith(
      expect.stringContaining("type=rent")
    );
  });

  it("includes offer=true in the URL when Offer is checked", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.click(cb("offer"));
    await user.click(screen.getByRole("button", { name: /^search$/i }));
    expect(navigateMock).toHaveBeenCalledWith(
      expect.stringContaining("offer=true")
    );
  });

  it("includes fuelType=petrol when Petrol is selected", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.click(cb("petrol"));
    await user.click(screen.getByRole("button", { name: /^search$/i }));
    expect(navigateMock).toHaveBeenCalledWith(
      expect.stringContaining("fuelType=petrol")
    );
  });

  it("omits yomMin from URL when left empty", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.click(screen.getByRole("button", { name: /^search$/i }));
    expect(navigateMock).toHaveBeenCalledWith(
      expect.not.stringContaining("yomMin")
    );
  });

  it("includes yomMin in URL when filled", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.type(screen.getByPlaceholderText(/from/i), "2015");
    await user.click(screen.getByRole("button", { name: /^search$/i }));
    expect(navigateMock).toHaveBeenCalledWith(
      expect.stringContaining("yomMin=2015")
    );
  });

  it("omits engine from URL when left empty", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.click(screen.getByRole("button", { name: /^search$/i }));
    expect(navigateMock).toHaveBeenCalledWith(
      expect.not.stringContaining("engine=")
    );
  });

  it("includes engine in URL when filled", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.type(screen.getByPlaceholderText(/v6|2\.0l/i), "V8");
    await user.click(screen.getByRole("button", { name: /^search$/i }));
    expect(navigateMock).toHaveBeenCalledWith(
      expect.stringContaining("engine=V8")
    );
  });

  it("includes sort and order in the URL", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.selectOptions(screen.getByRole("combobox"), "regularPrice_asc");
    await user.click(screen.getByRole("button", { name: /^search$/i }));
    expect(navigateMock).toHaveBeenCalledWith(
      expect.stringContaining("sort=regularPrice")
    );
    expect(navigateMock).toHaveBeenCalledWith(
      expect.stringContaining("order=asc")
    );
  });
});
