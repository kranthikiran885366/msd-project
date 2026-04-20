/**
 * Auth system tests — covers all 5 mandatory cases:
 * 1. Register same email twice → FAIL
 * 2. Register + GitHub login same email → LINK
 * 3. Google login existing email → LINK
 * 4. GitHub login new email → CREATE
 * 5. Login after linking → SUCCESS
 *
 * Run: npx jest tests/auth.test.js
 * Requires: jest, mongodb-memory-server, mongoose, bcryptjs
 */

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

const getAuthService = () => require("../services/authService");
const getUser = () => require("../models/User");

// ─── Test 1: Duplicate email registration ────────────────────────────────────
test("1. Register same email twice → second attempt blocked", async () => {
  const User = getUser();
  const email = "test@example.com";
  await new User({ email, password: "password123", name: "Alice" }).save();

  // authController.signup checks this before creating
  const existing = await User.findByEmail(email);
  expect(existing).not.toBeNull();

  // DB-level: unique index also rejects it
  await expect(
    new User({ email, password: "pass456", name: "Alice2" }).save()
  ).rejects.toThrow(/duplicate key/i);
});

// ─── Test 2: Register then GitHub login with same email → LINK ───────────────
test("2. Register locally then GitHub login with same email → links GitHub to existing user", async () => {
  const AuthService = getAuthService();
  const User = getUser();

  const email = "shared@example.com";
  const localUser = await new User({ email, password: "pass123", name: "Bob" }).save();

  const { user, isNewUser, isLinked } = await AuthService.findOrCreateUser(email, "github", {
    id: "gh_123",
    login: "bobgithub",
    avatar_url: "https://github.com/avatar.png",
    accessToken: "tok_abc",
    emailVerified: true,
  });

  expect(isNewUser).toBe(false);
  expect(isLinked).toBe(true);
  expect(user._id.toString()).toBe(localUser._id.toString());
  expect(user.oauth.github.id).toBe("gh_123");
  expect(await User.countDocuments({ email })).toBe(1);
});

// ─── Test 3: Google login with existing email → LINK ─────────────────────────
test("3. Google login with existing email → links Google to existing user", async () => {
  const AuthService = getAuthService();
  const User = getUser();

  const email = "carol@example.com";
  const existing = await new User({ email, password: "pass123", name: "Carol" }).save();

  const { user, isNewUser, isLinked } = await AuthService.findOrCreateUser(email, "google", {
    id: "google_456",
    email,
    picture: "https://google.com/photo.jpg",
    name: "Carol",
    refreshToken: "rt_xyz",
  });

  expect(isNewUser).toBe(false);
  expect(isLinked).toBe(true);
  expect(user._id.toString()).toBe(existing._id.toString());
  expect(user.oauth.google.id).toBe("google_456");
  expect(await User.countDocuments({ email })).toBe(1);
});

// ─── Test 4: GitHub login with new email → CREATE ────────────────────────────
test("4. GitHub login with brand-new email → creates new user", async () => {
  const AuthService = getAuthService();
  const User = getUser();

  const email = "newuser@example.com";
  const { user, isNewUser, isLinked } = await AuthService.findOrCreateUser(email, "github", {
    id: "gh_789",
    login: "newuser",
    avatar_url: "https://github.com/newuser.png",
    accessToken: "tok_new",
    emailVerified: true,
  });

  expect(isNewUser).toBe(true);
  expect(isLinked).toBe(false);
  expect(user.email).toBe(email);
  expect(user.oauth.github.id).toBe("gh_789");
  expect(await User.countDocuments({ email })).toBe(1);
});

// ─── Test 5: Login after linking → SUCCESS ───────────────────────────────────
test("5. Login after linking GitHub → same user found by GitHub ID, token refreshed", async () => {
  const AuthService = getAuthService();
  const User = getUser();

  const email = "dave@example.com";
  await new User({ email, password: "pass123", name: "Dave" }).save();

  // First: link GitHub
  await AuthService.findOrCreateUser(email, "github", {
    id: "gh_dave",
    login: "davegithub",
    avatar_url: null,
    accessToken: "tok_dave",
    emailVerified: true,
  });

  // Second: subsequent GitHub login — resolved by provider ID
  const { user, isNewUser, isLinked } = await AuthService.findOrCreateUser(email, "github", {
    id: "gh_dave",
    login: "davegithub",
    avatar_url: null,
    accessToken: "tok_dave_refreshed",
    emailVerified: true,
  });

  expect(isNewUser).toBe(false);
  expect(isLinked).toBe(false);
  expect(user.oauth.github.id).toBe("gh_dave");
  expect(user.oauth.github.accessToken).toBe("tok_dave_refreshed");
  expect(await User.countDocuments({ email })).toBe(1);
});
