import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { STARTER_CREDITS } from '@/lib/credits';

const providers: NextAuthOptions['providers'] = [];

// Google — only when real OAuth credentials are configured.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

// Email + password — primary sign-in method. Users register via /api/auth/register.
providers.push(
  CredentialsProvider({
    id: 'credentials',
    name: 'Email & Password',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      const email = credentials?.email?.trim().toLowerCase();
      const password = credentials?.password;
      if (!email || !password) return null;

      // Throttle guessing per account. NextAuth surfaces thrown messages as ?error=.
      const rl = rateLimit(`login:${email}`, 10, 15 * 60_000);
      if (!rl.ok) throw new Error('Too many sign-in attempts. Try again in a few minutes.');

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.passwordHash) return null;

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return null;

      return { id: user.id, email: user.email, name: user.name, image: user.image };
    },
  }),
);

// Dev login — local testing only. Hard-disabled in production builds.
if (process.env.ENABLE_DEV_LOGIN === 'true' && process.env.NODE_ENV !== 'production') {
  providers.push(
    CredentialsProvider({
      id: 'dev',
      name: 'Dev Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        name: { label: 'Name', type: 'text' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim();
        if (!email) return null;
        return {
          id: email,
          email,
          name: credentials?.name?.trim() || email.split('@')[0],
        };
      },
    }),
  );
}

export const authOptions: NextAuthOptions = {
  providers,

  session: { strategy: 'jwt' },

  callbacks: {
    async signIn({ user, account }) {
      if (!user?.email) return false;

      // Credentials users already exist in the DB (created by /api/auth/register).
      if (account?.provider === 'credentials') return true;

      // OAuth / dev sign-ins: sync profile, create on first login.
      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          ...(user.name ? { name: user.name } : {}),
          ...(user.image ? { image: user.image } : {}),
        },
        create: {
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
          // Starter credits so new users can create right away (FREE allowance).
          credits: STARTER_CREDITS,
        },
      });

      return true;
    },

    async jwt({ token }) {
      // При всяко обновяване на JWT зареждаме plan и userId в token
      if (!token?.email) return token;

      const dbUser = await prisma.user.findUnique({
        where: { email: String(token.email) },
        select: { id: true, plan: true },
      });

      if (dbUser) {
        token.userId = dbUser.id;
        token.plan = dbUser.plan;
      }

      return token;
    },

    async session({ session, token }) {
      // Добавяме userId и plan към session.user (за UI и protected логика)
      if (session.user && token.userId && token.plan) {
        session.user.id = token.userId;
        session.user.plan = token.plan;
      }
      return session;
    },
  },
};
