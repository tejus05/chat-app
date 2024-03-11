import GoogleProvider from "next-auth/providers/google";
import { UpstashRedisAdapter } from "@next-auth/upstash-redis-adapter"
import db from '@/db'
import { NextAuthOptions } from "next-auth";
import { fetchRedis } from "@/components/helpers/redis";

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
      const dbUserResult = (await fetchRedis("get",`user:${token.id}`)) as string | null; 

      if (!dbUserResult) {
        token.id = user.id;
        return token;
      }

      const dbUser = JSON.parse(dbUserResult) as User;

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.image,
        watchlist: dbUser.watchlist,
      }
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
        session.user.watchlist = token.watchlist as string[];
      }

      return session;
    },
    redirect() {
      return '/dashboard'
    }
  }
}

export default authOptions;