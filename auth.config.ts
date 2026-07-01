import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;
      const pathname = nextUrl.pathname;

      // Public paths
      if (
        pathname === "/" ||
        pathname.startsWith("/login") ||
        pathname.startsWith("/api/auth")
      ) {
        return true;
      }

      if (!isLoggedIn) return false;

      // Superadmin routes
      if (pathname.startsWith("/superadmin")) {
        return role === "superadmin";
      }

      // School-specific routes
      const schoolSlugMatch = pathname.match(/^\/([^/]+)\/(admin|teacher|student)/);
      if (schoolSlugMatch) {
        const section = schoolSlugMatch[2];
        if (section === "admin") return role === "school_admin";
        if (section === "teacher") return role === "teacher";
        if (section === "student") return role === "student";
      }

      return false;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.schoolId = user.schoolId;
        token.schoolSlug = user.schoolSlug;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.schoolId = token.schoolId as string | undefined;
        session.user.schoolSlug = token.schoolSlug as string | undefined;
      }
      return session;
    },
  },
  providers: [],
  session: {
    strategy: "jwt",
  },
  trustHost: true,
};
