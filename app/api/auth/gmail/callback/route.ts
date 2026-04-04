import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const errorParam = searchParams.get('error')

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  if (errorParam) {
    return NextResponse.redirect(new URL('/gmail-sync?error=access_denied', siteUrl))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/gmail-sync?error=invalid_callback', siteUrl))
  }

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user || user.id !== state) {
    return NextResponse.redirect(new URL('/gmail-sync?error=auth_failed', siteUrl))
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/gmail/callback'

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL('/gmail-sync?error=token_exchange_failed', siteUrl))
  }

  const tokens = await tokenRes.json()

  if (!tokens.refresh_token) {
    return NextResponse.redirect(new URL('/gmail-sync?error=no_refresh_token', siteUrl))
  }

  await supabase
    .from('profiles')
    .update({
      gmail_connected: true,
      gmail_refresh_token: tokens.refresh_token,
      last_gmail_sync_at: null,
    })
    .eq('id', user.id)

  return NextResponse.redirect(new URL('/gmail-sync?connected=true', siteUrl))
}
