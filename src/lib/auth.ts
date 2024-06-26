import getDataUser from '@/server-getData/getDataUser'
import type { TUser } from '@/types/user.types'
import { loginZodSchema } from '@/zod/auth.zod'
import bcrypt from 'bcryptjs'
import NextAuth, {
  DefaultSession,
  NextAuthConfig,
  Session,
  User
} from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { NextResponse } from 'next/server'

type JWT = { [key: string]: any }

declare module 'next-auth' {
  interface User {
    hasAccess: TUser['hasAccess']
  }
  // Extend session to hold the userId
  interface Session extends DefaultSession {
    user: User & { userId: TUser['id']; userHasAccess: TUser['hasAccess'] }
  }
}

export const config = {
  pages: {
    signIn: '/login'
  },
  providers: [
    Credentials({
      /** runs ON LOGIN */
      async authorize(credentials) {
        // validate credentials
        const parsedCredentials = loginZodSchema.safeParse(credentials)

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data

          // get user from db
          const user = await getDataUser({ email })
          if (!user) return null

          // compare password
          const passwordsMatch = await bcrypt.compare(
            password,
            user.hashedPassword
          )

          if (passwordsMatch) {
            return user // available in jwt callback
          }
        }

        return null
      }
    })
  ],
  callbacks: {
    /** add userId to JWT
     *  runs AFTER authorize.
     *  => userId + userHasAccess available SERVER-side.
     *  JWT is forwarded to session callback.
     */
    async jwt({
      token,
      user,
      trigger
    }: {
      token: JWT
      user: User
      trigger?: 'signIn' | 'signUp' | 'update'
    }) {
      if (user) {
        // on login
        // default token holds id + email + name + image
        token.userId = user.id
        token.userHasAccess = user.hasAccess
      }

      if (trigger === 'update') {
        // on update (from payment page - success)
        const userEmail = token.email // unique
        const user = await getDataUser({ email: userEmail })
        console.log('user:', user)
        if (!user) return token

        const hasAccess = user.hasAccess
        token.userHasAccess = hasAccess
        console.log('token:', token)
      }

      return token
    },
    /** add userId + userHasAccess to session.user
     *  runs AFTER jwt callback.
     *  => userId + userHasAccess available CLIENT-side .
     */
    async session({ token, session }: { token: JWT; session: Session }) {
      // get userId + userHasAccess from token
      const userId = token?.userId
      const userHasAccess = token?.userHasAccess
      // add userId + userHasAccess to session
      session.user.userId = userId
      session.user.userHasAccess = userHasAccess
      return session
    },
    /** protect routes - runs on every request matching next-middleware */
    authorized({ auth, request }) {
      // auth = session
      const isLoggedIn = !!auth?.user
      const hasAccessToApp = auth?.user?.userHasAccess
      const isTryingToAccessApp = request.nextUrl.pathname.includes('/app')
      const isTryingToAccessLogin = request.nextUrl.pathname.includes('/login')
      const isTryingToAccessSignup =
        request.nextUrl.pathname.includes('/signup')
      const isTryingToAccessPayment =
        request.nextUrl.pathname.includes('/payment')

      if (isTryingToAccessPayment) {
        console.log('0')
        return true
      }

      if (!isLoggedIn && isTryingToAccessApp) {
        console.log('1')
        return false
      }

      if (isLoggedIn && !hasAccessToApp && isTryingToAccessApp) {
        console.log('2')
        return NextResponse.redirect(
          new URL('/payment', request.nextUrl.origin)
        )
      }

      if (isLoggedIn && hasAccessToApp && isTryingToAccessApp) {
        console.log('3')
        return true
      }

      if (
        isLoggedIn &&
        hasAccessToApp &&
        (isTryingToAccessLogin || isTryingToAccessSignup)
      ) {
        console.log('4')
        return NextResponse.redirect(
          new URL('/app/dashboard', request.nextUrl.origin)
        )
      }

      if (isLoggedIn && !hasAccessToApp && !isTryingToAccessApp) {
        if (isTryingToAccessLogin || isTryingToAccessSignup) {
          console.log('5')
          return NextResponse.redirect(
            new URL('/payment', request.nextUrl.origin)
          )
        } else {
          console.log('6')
          return true
        }
      }

      if (!isLoggedIn && !isTryingToAccessApp) {
        console.log('7')
        return true
      }

      console.log('8')
      return false
    }
  }
} satisfies NextAuthConfig

export const { handlers, signIn, signOut, auth } = NextAuth(config)
