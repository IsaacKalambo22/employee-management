import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // For now, we'll implement a simple auth
        // In production, you'd hash passwords and check against DB
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          },
          include: {
            employee: true
          }
        })

        if (!user || !user.password) {
          return null
        }

        const passwordValid = await bcrypt.compare(credentials.password, user.password)
        if (!passwordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId ?? undefined
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.employeeId = user.employeeId
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.employeeId = token.employeeId as string
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error"
  }
}
