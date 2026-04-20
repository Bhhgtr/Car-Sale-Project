import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import PrivateRoute from "../../components/PrivateRoute";

// ─── Redux store factory ───────────────────────────────────────────────────────

const buildStore = (currentUser = null) =>
  configureStore({
    reducer: {
      user: () => ({ currentUser }),
    },
  });

// ─── Render helper ────────────────────────────────────────────────────────────
// PrivateRoute only makes sense inside a Routes tree:
// MemoryRouter lets us start at /protected and observe where we end up.

const renderPrivateRoute = (currentUser = null) =>
  render(
    <Provider store={buildStore(currentUser)}>
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route
              path="/protected"
              element={<div data-testid="protected-page">Protected Content</div>}
            />
          </Route>
          <Route
            path="/sign-in"
            element={<div data-testid="sign-in-page">Sign In Page</div>}
          />
        </Routes>
      </MemoryRouter>
    </Provider>
  );

// ─── Logged in ────────────────────────────────────────────────────────────────

describe("PrivateRoute — logged in", () => {
  const mockUser = { _id: "user123", username: "johndoe" };

  it("renders the protected child route when currentUser exists", () => {
    renderPrivateRoute(mockUser);
    expect(screen.getByTestId("protected-page")).toBeInTheDocument();
  });

  it("renders the correct child content when currentUser exists", () => {
    renderPrivateRoute(mockUser);
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("does not redirect to /sign-in when currentUser exists", () => {
    renderPrivateRoute(mockUser);
    expect(screen.queryByTestId("sign-in-page")).not.toBeInTheDocument();
  });
});

// ─── Logged out ───────────────────────────────────────────────────────────────

describe("PrivateRoute — logged out", () => {
  it("redirects to /sign-in when currentUser is null", () => {
    renderPrivateRoute(null);
    expect(screen.getByTestId("sign-in-page")).toBeInTheDocument();
  });

  it("does not render the protected child when currentUser is null", () => {
    renderPrivateRoute(null);
    expect(screen.queryByTestId("protected-page")).not.toBeInTheDocument();
  });

  it("does not render the protected content when currentUser is null", () => {
    renderPrivateRoute(null);
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });
});
