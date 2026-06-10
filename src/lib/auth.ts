import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';

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

// Dev login — local testing without Google. Gated by env; never enable in prod.
if (process.env.ENABLE_DEV_LOGIN === 'true') {
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
    async signIn({ user }) {
      // user съдържа name/email/image от Google
      if (!user?.email) return false;

      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name ?? null,
          image: user.image ?? null,
        },
        create: {
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
          // Starter credits so new users can create right away (FREE allowance).
          credits: 20,
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
