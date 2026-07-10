const test = require("node:test");
const assert = require("node:assert");
const sendResponse = require("../utils/responseHandler");

test("Response Handler Utility Test Suite", async (t) => {
  await t.test("sendResponse sends error payload when status is false", () => {
    let capturedStatusCode = null;
    let capturedJson = null;

    const res = {
      status(code) {
        capturedStatusCode = code;
        return this;
      },
      json(data) {
        capturedJson = data;
        return this;
      },
    };

    sendResponse(res, 400, false, "Invalid payload fields", { field: "username" });

    assert.strictEqual(capturedStatusCode, 400);
    assert.deepStrictEqual(capturedJson, {
      status: false,
      error: "Invalid payload fields",
      data: { field: "username" },
    });
  });

  await t.test("sendResponse sends success payload when status is true", () => {
    let capturedStatusCode = null;
    let capturedJson = null;

    const res = {
      status(code) {
        capturedStatusCode = code;
        return this;
      },
      json(data) {
        capturedJson = data;
        return this;
      },
    };

    sendResponse(res, 201, true, "Resource created successfully", { id: "new-user-id" });

    assert.strictEqual(capturedStatusCode, 201);
    assert.deepStrictEqual(capturedJson, {
      status: true,
      message: "Resource created successfully",
      data: { id: "new-user-id" },
    });
  });
});
