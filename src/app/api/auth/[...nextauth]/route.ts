// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  // ── Provider : email + mot de passe ──────────────────────────────
  providers: [
    CredentialsProvider({
      name: 'Identifiants',
      credentials: {
        email:      { label: 'Email',       type: 'email' },
        motDePasse: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.motDePasse) return null

        // Chercher l'utilisateur en BDD
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })

        if (!user || !user.actif) return null

        // Comparer le mot de passe avec le hash bcrypt
        const valide = await bcrypt.compare(credentials.motDePasse, user.motDePasse)
        if (!valide) return null

        // Retourner l'objet utilisateur (stocké dans le token JWT)
        return {
          id:    user.id,
          name:  user.nom,
          email: user.email,
          role:  user.role,
        }
      },
    }),
  ],

  // ── Stratégie JWT (pas de table Session en BDD) ───────────────────
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 }, // 8h

  // ── Callbacks pour enrichir le token et la session ────────────────
  callbacks: {
    async jwt({ token, user }) {
      // À la connexion : ajouter le rôle dans le token
      if (user) token.role = (user as any).role
      return token
    },
    async session({ session, token }) {
      // Rendre le rôle accessible dans session.user
      if (session.user) {
        (session.user as any).id   = token.sub
        ;(session.user as any).role = token.role
      }
      return session
    },
  },

  // ── Pages personnalisées ──────────────────────────────────────────
  pages: {
    signIn: '/login',   // Notre page de connexion custom
    error:  '/login',   // Rediriger les erreurs vers login
  },

  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
