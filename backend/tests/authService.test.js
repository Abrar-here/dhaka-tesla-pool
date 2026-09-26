const { connectTestDB, clearTestDB, disconnectTestDB } = require("./setup");
const jwt = require("jsonwebtoken");
const User = require("../src/models/User");
const authService = require("../src/services/authService");

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

describe("authService.register", () => {
  test("creates a user with a hashed password (never stores plaintext)", async () => {
    const { user, token } = await authService.register({
      name: "Test Driver",
      email: "newdriver@test.com",
      password: "password123",
      role: "driver",
    });

    expect(user.email).toBe("newdriver@test.com");
    expect(user.passwordHash).not.toBe("password123");
    expect(user.passwordHash.length).toBeGreaterThan(20); // bcrypt hashes are long
    expect(typeof token).toBe("string");
  });

  test("lowercases email on registration", async () => {
    const { user } = await authService.register({
      name: "Case Test",
      email: "MixedCase@Test.com",
      password: "password123",
      role: "passenger",
    });
    expect(user.email).toBe("mixedcase@test.com");
  });

  test("rejects registration with a duplicate email", async () => {
    await authService.register({
      name: "First User",
      email: "duplicate@test.com",
      password: "password123",
      role: "passenger",
    });

    await expect(
      authService.register({
        name: "Second User",
        email: "duplicate@test.com",
        password: "differentpassword",
        role: "driver",
      }),
    ).rejects.toThrow(/already in use/i);
  });

  test("rejects an invalid role", async () => {
    await expect(
      authService.register({
        name: "Bad Role",
        email: "badrole@test.com",
        password: "password123",
        role: "admin",
      }),
    ).rejects.toThrow(/role must be/i);
  });

  test("rejects registration with missing required fields", async () => {
    await expect(
      authService.register({
        name: "Missing Fields",
        email: "missing@test.com",
        // no password, no role
      }),
    ).rejects.toThrow(/required/i);
  });

  test("issues a JWT containing the user's id and role", async () => {
    const { user, token } = await authService.register({
      name: "Token Check",
      email: "tokencheck@test.com",
      password: "password123",
      role: "driver",
    });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.sub).toBe(user._id.toString());
    expect(decoded.role).toBe("driver");
  });
});

describe("authService.login", () => {
  beforeEach(async () => {
    await authService.register({
      name: "Login Test User",
      email: "logintest@test.com",
      password: "correctpassword",
      role: "passenger",
    });
  });

  test("logs in successfully with correct credentials", async () => {
    const { user, token } = await authService.login({
      email: "logintest@test.com",
      password: "correctpassword",
    });
    expect(user.email).toBe("logintest@test.com");
    expect(typeof token).toBe("string");
  });

  test("rejects login with wrong password", async () => {
    await expect(
      authService.login({
        email: "logintest@test.com",
        password: "wrongpassword",
      }),
    ).rejects.toThrow(/invalid email or password/i);
  });

  test("rejects login for a non-existent email", async () => {
    await expect(
      authService.login({
        email: "doesnotexist@test.com",
        password: "whatever",
      }),
    ).rejects.toThrow(/invalid email or password/i);
  });

  test("gives the same error message for wrong password and unknown email (no user enumeration)", async () => {
    let wrongPasswordError, unknownEmailError;
    try {
      await authService.login({
        email: "logintest@test.com",
        password: "wrong",
      });
    } catch (e) {
      wrongPasswordError = e.message;
    }
    try {
      await authService.login({
        email: "unknown@test.com",
        password: "whatever",
      });
    } catch (e) {
      unknownEmailError = e.message;
    }
    expect(wrongPasswordError).toBe(unknownEmailError);
  });
});
