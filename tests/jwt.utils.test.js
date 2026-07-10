const test = require("node:test");
const assert = require("node:assert");
const { generateKeyPairSync } = require("crypto");

// 1. Generate standard RSA key pair for testing
const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: "spki",
    format: "pem",
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
});

// 2. Load keys into environment variables so jwt.utils.js doesn't fail
process.env.JWT_PRIVATE_KEY = privateKey.replace(/\r?\n/g, "\\n");
process.env.JWT_PUBLIC_KEY = publicKey.replace(/\r?\n/g, "\\n");
process.env.JWT_ACCESS_TOKEN_EXPIRE = "900";
process.env.JWT_REFRESH_TOKEN_EXPIRE = "604800";

// 3. Import JWT utilities
const jwtUtils = require("../utils/jwt.utils");

test("JWT Utilities Test Suite", async (t) => {
  await t.test("getAccessTokenExpiry returns parsed integer from env", () => {
    const expiry = jwtUtils.getAccessTokenExpiry();
    assert.strictEqual(expiry, 900);
  });

  await t.test("getRefreshTokenExpiry returns parsed integer from env", () => {
    const expiry = jwtUtils.getRefreshTokenExpiry();
    assert.strictEqual(expiry, 604800);
  });

  await t.test("generateRefreshTokenString generates a 40-byte random hex string (length 80)", () => {
    const token = jwtUtils.generateRefreshTokenString();
    assert.strictEqual(typeof token, "string");
    assert.strictEqual(token.length, 80);
    assert.match(token, /^[0-9a-fA-F]{80}$/);
  });

  await t.test("generateAccessToken and decryptAndVerifyJWT processes custom payload correctly", async () => {
    const payload = {
      userId: "user-123",
      clientId: "hrm-app",
      email: "test@example.com",
      name: "John Doe",
      isActive: true,
    };

    const encryptedToken = await jwtUtils.generateAccessToken(payload);
    assert.strictEqual(typeof encryptedToken, "string");

    const decodedPayload = await jwtUtils.decryptAndVerifyJWT(encryptedToken);
    
    assert.strictEqual(decodedPayload.id, payload.userId);
    assert.strictEqual(decodedPayload.clientId, payload.clientId);
    assert.strictEqual(decodedPayload.email, payload.email);
    assert.strictEqual(decodedPayload.name, payload.name);
    assert.strictEqual(decodedPayload.isActive, payload.isActive);
    assert.strictEqual(decodedPayload.type, "access");
  });
});
