import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      if (auth?.user) return true;
      const callbackUrl = nextUrl.href;
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", callbackUrl);
      return Response.redirect(loginUrl);
    },
  },
  providers: [],
} satisfies NextAuthConfig;
