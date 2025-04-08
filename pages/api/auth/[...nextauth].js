import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '../../../lib/prisma';
import { UserRole } from '@prisma/client';
import { compare } from 'bcryptjs'; // <-- Import compare

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          console.error('Credentials missing');
          // Throwing an error provides better feedback on the client via query param
          throw new Error("Missing email or password.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() } // Check lowercase email
        });

        if (!user) {
          console.log('No user found with email:', credentials.email.toLowerCase());
           throw new Error("Invalid credentials."); // Generic error
        }

        // Check if the user has a password set (might have signed up via OAuth)
        if (!user.passwordHash) {
            console.log('User has no password hash set (likely OAuth only):', user.email);
            throw new Error("Account exists but password login is not enabled. Try another sign-in method.");
        }

        // --- Compare provided password with stored hash ---
        const isValidPassword = await compare(
            credentials.password,
            user.passwordHash // Make sure this field exists in your DB
        );
        // --------------------------------------------------

        if (!isValidPassword) {
          console.log('Password mismatch for user:', user.email);
          throw new Error("Invalid credentials."); // Generic error
        }

        console.log('Credentials valid for user:', user.email);
        // Return user object expected by NextAuth
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      }
    })
  ],
  // ... rest of your authOptions (session strategy, secret, pages, callbacks, debug) ...
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error', // Good to have an error page
  },
  callbacks: {
    async jwt({ token, user, account, profile, trigger, session: updateSessionData }) {
        // Add user ID and ROLE on initial sign in
        if (user) {
            token.id = user.id;
            // Fetch role during sign-in / token creation if not directly on user object from authorize/profile
             const dbUser = await prisma.user.findUnique({
                 where: { id: user.id },
                 select: { role: true }
             });
             token.role = dbUser?.role || UserRole.RESEARCHER; // Default to RESEARCHER if not found
        }
         // Example: Handle session updates if needed (e.g., update name)
         // if (trigger === "update" && updateSessionData?.name) {
         //   token.name = updateSessionData.name;
         // }
        return token;
    },
    async session({ session, token, user }) {
        // Add user ID and ROLE from token to the session object
        if (token?.id && session.user) {
            session.user.id = token.id;
        }
         if (token?.role && session.user) {
            session.user.role = token.role; // Add role here!
        }
        return session;
    },
},
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);