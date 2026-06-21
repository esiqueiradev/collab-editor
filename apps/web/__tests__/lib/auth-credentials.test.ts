// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

import { verifyCredentials } from "@/lib/auth-credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const mockFindUnique = vi.mocked(prisma.user.findUnique);
const mockCompare = vi.mocked(bcrypt.compare);

const fakeUser = {
  id: "user-1",
  email: "alice@example.com",
  name: "Alice",
  avatarUrl: null,
  passwordHash: "hashed",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("verifyCredentials", () => {
  it("returns null when user does not exist", async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const result = await verifyCredentials("ghost@example.com", "password");

    expect(result).toBeNull();
    expect(mockCompare).not.toHaveBeenCalled();
  });

  it("returns null when user has no password (OAuth-only account)", async () => {
    mockFindUnique.mockResolvedValueOnce({ ...fakeUser, passwordHash: null } as never);

    const result = await verifyCredentials("alice@example.com", "password");

    expect(result).toBeNull();
    expect(mockCompare).not.toHaveBeenCalled();
  });

  it("returns null when password does not match", async () => {
    mockFindUnique.mockResolvedValueOnce(fakeUser as never);
    mockCompare.mockResolvedValueOnce(false as unknown as never);

    const result = await verifyCredentials("alice@example.com", "wrongpassword");

    expect(result).toBeNull();
  });

  it("returns the user object when credentials are valid", async () => {
    mockFindUnique.mockResolvedValueOnce(fakeUser as never);
    mockCompare.mockResolvedValueOnce(true as unknown as never);

    const result = await verifyCredentials("alice@example.com", "correctpassword");

    expect(result).toEqual({
      id: "user-1",
      email: "alice@example.com",
      name: "Alice",
      image: null,
    });
  });

  it("queries the database by the provided email", async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    await verifyCredentials("specific@example.com", "pass");

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { email: "specific@example.com" },
    });
  });

  it("compares against the stored hash, not the plain password", async () => {
    mockFindUnique.mockResolvedValueOnce(fakeUser as never);
    mockCompare.mockResolvedValueOnce(true as unknown as never);

    await verifyCredentials("alice@example.com", "myplainpassword");

    expect(mockCompare).toHaveBeenCalledWith("myplainpassword", "hashed");
  });
});
