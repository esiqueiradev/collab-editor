// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/register/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed-password"),
    compare: vi.fn(),
  },
}));

import { prisma } from "@/lib/prisma";

const mockFindUnique = vi.mocked(prisma.user.findUnique);
const mockCreate = vi.mocked(prisma.user.create);

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/auth/register", () => {
  it("returns 400 when email is missing", async () => {
    const res = await POST(makeRequest({ password: "secret123" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
    expect(body.data).toBeNull();
  });

  it("returns 400 when password is missing", async () => {
    const res = await POST(makeRequest({ email: "user@example.com" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it("returns 400 when password is shorter than 8 characters", async () => {
    const res = await POST(makeRequest({ email: "user@example.com", password: "short" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/8 characters/i);
  });

  it("returns 409 when email is already in use", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "existing-id" } as never);

    const res = await POST(makeRequest({ email: "taken@example.com", password: "validpass" }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/already in use/i);
  });

  it("creates user and returns 201 on valid input", async () => {
    mockFindUnique.mockResolvedValueOnce(null);
    mockCreate.mockResolvedValueOnce({
      id: "new-id",
      email: "new@example.com",
      name: "Alice",
    } as never);

    const res = await POST(
      makeRequest({ name: "Alice", email: "new@example.com", password: "validpass" })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data).toMatchObject({ id: "new-id", email: "new@example.com" });
    expect(body.error).toBeNull();
  });

  it("hashes the password before storing", async () => {
    const bcrypt = await import("bcryptjs");
    mockFindUnique.mockResolvedValueOnce(null);
    mockCreate.mockResolvedValueOnce({ id: "x", email: "a@b.com", name: null } as never);

    await POST(makeRequest({ email: "a@b.com", password: "mypassword" }));

    expect(bcrypt.default.hash).toHaveBeenCalledWith("mypassword", 12);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ passwordHash: "hashed-password" }),
      })
    );
  });

  it("returns 500 on unexpected database error", async () => {
    mockFindUnique.mockRejectedValueOnce(new Error("DB connection lost"));

    const res = await POST(makeRequest({ email: "a@b.com", password: "validpass" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/internal server error/i);
  });
});
