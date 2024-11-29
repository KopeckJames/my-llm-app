import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: AuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        }),
    ],
    pages: {
        signIn: '/auth/signin',
    },
    callbacks: {
        async session({ session, token }) {
            return session;
        },
        async jwt({ token, user, account }) {
            return token;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};