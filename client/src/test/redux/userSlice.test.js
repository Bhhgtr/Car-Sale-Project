import { describe, it, expect } from "vitest";
import reducer, {
  signInStart,
  signInSuccess,
  signInFailure,
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
  deleteUserStart,
  deleteUserSuccess,
  deleteUserFailure,
  signOutUserStart,
  signOutUserSuccess,
  signOutUserFailure,
} from "../../redux/user/userSlice";

const initialState = {
  currentUser: null,
  error: null,
  loading: null,
};

const fakeUser = { _id: "123", username: "john", email: "john@test.com" };
const fakeError = "Something went wrong";

// ─── Initial State ────────────────────────────────────────────────────────────

describe("userSlice — initial state", () => {
  it("returns the correct initial state when called with undefined", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual(initialState);
  });
});

// ─── Sign In ──────────────────────────────────────────────────────────────────

describe("userSlice — signIn", () => {
  it("signInStart sets loading to true", () => {
    const state = reducer(initialState, signInStart());
    expect(state.loading).toBe(true);
  });

  it("signInSuccess sets currentUser and clears loading and error", () => {
    const state = reducer(
      { ...initialState, loading: true, error: fakeError },
      signInSuccess(fakeUser)
    );
    expect(state.currentUser).toEqual(fakeUser);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("signInFailure sets error and clears loading", () => {
    const state = reducer(
      { ...initialState, loading: true },
      signInFailure(fakeError)
    );
    expect(state.error).toBe(fakeError);
    expect(state.loading).toBe(false);
    expect(state.currentUser).toBeNull();
  });
});

// ─── Update User ──────────────────────────────────────────────────────────────

describe("userSlice — updateUser", () => {
  it("updateUserStart sets loading to true", () => {
    const state = reducer(initialState, updateUserStart());
    expect(state.loading).toBe(true);
  });

  it("updateUserSuccess updates currentUser and clears loading and error", () => {
    const updatedUser = { ...fakeUser, username: "john_updated" };
    const state = reducer(
      { currentUser: fakeUser, loading: true, error: fakeError },
      updateUserSuccess(updatedUser)
    );
    expect(state.currentUser).toEqual(updatedUser);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("updateUserFailure sets error and clears loading", () => {
    const state = reducer(
      { currentUser: fakeUser, loading: true, error: null },
      updateUserFailure(fakeError)
    );
    expect(state.error).toBe(fakeError);
    expect(state.loading).toBe(false);
    expect(state.currentUser).toEqual(fakeUser); // user unchanged
  });
});

// ─── Delete User ──────────────────────────────────────────────────────────────

describe("userSlice — deleteUser", () => {
  it("deleteUserStart sets loading to true", () => {
    const state = reducer(
      { currentUser: fakeUser, loading: false, error: null },
      deleteUserStart()
    );
    expect(state.loading).toBe(true);
  });

  it("deleteUserSuccess clears currentUser and error and sets loading to false", () => {
    const state = reducer(
      { currentUser: fakeUser, loading: true, error: null },
      deleteUserSuccess()
    );
    expect(state.currentUser).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("deleteUserFailure sets error and clears loading, preserves currentUser", () => {
    const state = reducer(
      { currentUser: fakeUser, loading: true, error: null },
      deleteUserFailure(fakeError)
    );
    expect(state.error).toBe(fakeError);
    expect(state.loading).toBe(false);
    expect(state.currentUser).toEqual(fakeUser); // user still present
  });
});

// ─── Sign Out ─────────────────────────────────────────────────────────────────

describe("userSlice — signOutUser", () => {
  it("signOutUserStart sets loading to true", () => {
    const state = reducer(
      { currentUser: fakeUser, loading: false, error: null },
      signOutUserStart()
    );
    expect(state.loading).toBe(true);
  });

  it("signOutUserSuccess clears currentUser and error and sets loading to false", () => {
    const state = reducer(
      { currentUser: fakeUser, loading: true, error: null },
      signOutUserSuccess()
    );
    expect(state.currentUser).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("signOutUserFailure sets error and clears loading, preserves currentUser", () => {
    const state = reducer(
      { currentUser: fakeUser, loading: true, error: null },
      signOutUserFailure(fakeError)
    );
    expect(state.error).toBe(fakeError);
    expect(state.loading).toBe(false);
    expect(state.currentUser).toEqual(fakeUser); // user still present
  });
});

// ─── State isolation ─────────────────────────────────────────────────────────

describe("userSlice — state isolation", () => {
  it("does not mutate the previous state object", () => {
    const before = { ...initialState };
    reducer(initialState, signInStart());
    expect(initialState).toEqual(before);
  });

  it("successive actions do not bleed into each other", () => {
    let state = reducer(undefined, { type: "@@INIT" });
    state = reducer(state, signInStart());
    state = reducer(state, signInFailure(fakeError));
    state = reducer(state, signInStart()); // loading goes true again
    expect(state.loading).toBe(true);
    expect(state.error).toBe(fakeError); // error persists until success clears it
  });
});