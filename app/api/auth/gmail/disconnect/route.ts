import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('gmail_refresh_token')
    .eq('id', user.id)
    .single()

  if (profile?.gmail_refresh_token) {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${profile.gmail_refresh_token}`, {
      method: 'POST',
    }).catch(() => {
      // Ignore revocation errors — still disconnect locally
    })
  }

  await supabase
    .from('profiles')
    .update({
      gmail_connected: false,
      gmail_refresh_token: null,
      last_gmail_sync_at: null,
    })
    .eq('id', user.id)

  return NextResponse.json({ success: true })
}
