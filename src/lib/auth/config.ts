import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { UserRepository } from "../db/repositories/UserRepository"

export const authConfig: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await UserRepository.verifyPassword(
          credentials.email as string,
          credentials.password as string
        )

        if (!user) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  trustHost: true,
  callbacks: {
    async jwt({ token, user, account }) {
      console.log("JWT callback:", { hasUser: !!user, hasToken: !!token, hasAccount: !!account })
      if (user) {
        token.id = user.id
        token.role = user.role
        console.log("JWT: Adding user to token", { id: user.id, role: user.role })
      }
      return token
    },
    async session({ session, token }) {
      console.log("Session callback:", { hasSession: !!session, hasToken: !!token })
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as "PLAYER" | "UMPIRE" | "ADMIN"
        console.log("Session: Adding token to session", { id: token.id, role: token.role })
      }
      return session
    },
    async signIn({ user, account, profile }) {
      console.log("SignIn callback:", { hasUser: !!user, hasAccount: !!account, email: user?.email })
      return true
    },
  },
  debug: true,
  session: {
    strategy: "jwt",
  },
}
