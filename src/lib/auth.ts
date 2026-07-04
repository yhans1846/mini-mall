// src/lib/auth.ts — NextAuth 配置（仅商城登录）
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      id: "mall-login",
      name: "商城登录",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.mallUser.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user) return null;
        const isValid = await compare(credentials.password as string, user.password);
        if (!isValid) return null;
        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: "USER",
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role || "USER";
        token.avatar = user.avatar;
      }
      if (trigger === "update") {
        const dbUser = await prisma.mallUser.findUnique({
          where: { id: parseInt(token.id as string, 10) },
          select: { name: true, avatar: true },
        });
        if (dbUser) {
          token.name = dbUser.name;
          token.avatar = dbUser.avatar;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.avatar = token.avatar as string;
      }
      return session;
    },
  },
});
