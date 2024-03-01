import GoogleProvider from "next-auth/providers/google";
import { UpstashRedisAdapter } from "@next-auth/upstash-redis-adapter"
import db from '@/db'
import { NextAuthOptions } from "next-auth";

const authOptions: NextAuthOptions = {
  adapter: UpstashRedisAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: '/login'
  },
  callbacks: {
    async jwt({ token, user }) {
      const dbUser = (await db.get(`user:${token.id}`)) as User | null;

      if (!dbUser) {
        token.id = user.id;
        return token;
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.image,
      }
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
      }

      return session;
    },
    redirect() {
      return '/dashboard'
    }
  }
}

export default authOptions;