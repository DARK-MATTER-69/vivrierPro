// middleware.ts  (à la racine du projet, pas dans /src)
// ═══════════════════════════════════════════════════════════════════
// PROTECTION DES ROUTES PAR RÔLE
// ═══════════════════════════════════════════════════════════════════
//
//  Route        │ ADMIN │ OPERATEUR │ CHAUFFEUR │ Non connecté
//  ─────────────┼───────┼───────────┼───────────┼──────────────
//  /            │  ✅   │    ✅     │    ✅     │  → /login
//  /commandes   │  ✅   │    ✅     │    ❌     │  → /login
//  /livraisons  │  ✅   │    ✅     │    ✅     │  → /login
//  /admin       │  ✅   │    ❌     │    ❌     │  → /login
//  /login       │  ✅   │    ✅     │    ✅     │  ✅ (public)

import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path  = req.nextUrl.pathname

    // ── Protection de /admin → ADMIN uniquement ──────────────────
    if (path.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/acces-refuse', req.url))
    }

    // ── Protection de /commandes → ADMIN ou OPERATEUR ────────────
    if (path.startsWith('/commandes') && token?.role === 'CHAUFFEUR') {
      return NextResponse.redirect(new URL('/acces-refuse', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      // Autoriser l'accès uniquement si un token existe
      authorized: ({ token }) => !!token,
    },
  }
)

// Routes protégées (toutes sauf /login, /api/auth, /acces-refuse)
export const config = {
  matcher: [
    '/((?!login|acces-refuse|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}
