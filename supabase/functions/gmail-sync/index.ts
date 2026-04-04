import { createClient } from 'npm:@supabase/supabase-js'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID')!
const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!

interface Card {
  id: string
  bank_name: string
  last_four_digits: string
}

interface GmailMessage {
  id: string
  threadId: string
}

interface GmailMessageDetail {
  id: string
  payload: {
    headers: Array<{ name: string; value: string }>
    parts?: Array<{ mimeType: string; body: { data?: string } }>
    body?: { data?: string }
  }
}

async function getAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: googleClientId,
      client_secret: googleClientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`)
  const data = await res.json()
  return data.access_token
}

function decodeEmailBody(detail: GmailMessageDetail): string {
  // Try parts first (multipart emails)
  if (detail.payload.parts) {
    for (const part of detail.payload.parts) {
      if ((part.mimeType === 'text/plain' || part.mimeType === 'text/html') && part.body.data) {
        const decoded = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'))
        return new TextDecoder('utf-8').decode(
          new Uint8Array([...decoded].map((c) => c.charCodeAt(0)))
        )
      }
    }
  }
  // Fallback to top-level body
  if (detail.payload.body?.data) {
    const decoded = atob(detail.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))
    return new TextDecoder('utf-8').decode(
      new Uint8Array([...decoded].map((c) => c.charCodeAt(0)))
    )
  }
  return ''
}

async function parseEmail(emailBody: string, bankName: string): Promise<Record<string, unknown>> {
  const supabaseInternalUrl = supabaseUrl.replace('.supabase.co', '.supabase.co')
  const res = await fetch(`${supabaseInternalUrl}/functions/v1/parse-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({ email_body: emailBody, bank_name: bankName }),
  })
  if (!res.ok) return { is_transaction: false }
  return res.json()
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  // Extract user from JWT
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Verify user token
  const userSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!)
  const { data: { user }, error: userError } = await userSupabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  )

  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const userId = user.id

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('gmail_connected, gmail_refresh_token, last_gmail_sync_at')
    .eq('id', userId)
    .single()

  if (!profile?.gmail_connected || !profile?.gmail_refresh_token) {
    return new Response(
      JSON.stringify({ error: 'Gmail not connected' }),
      { status: 400 }
    )
  }

  // Create sync log
  const { data: syncLog } = await supabase
    .from('gmail_sync_logs')
    .insert({ user_id: userId, status: 'running' })
    .select('id')
    .single()

  const syncLogId = syncLog?.id
  const errors: string[] = []
  let emailsProcessed = 0
  let transactionsCreated = 0

  try {
    const accessToken = await getAccessToken(profile.gmail_refresh_token)

    // Fetch active bank email templates
    const { data: templates } = await supabase
      .from('bank_email_templates')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (!templates || templates.length === 0) {
      throw new Error('Không có mẫu email nào được cấu hình')
    }

    // Fetch user's cards for matching card_last_four
    const { data: cards } = await supabase
      .from('cards')
      .select('id, bank_name, last_four_digits')
      .eq('user_id', userId)
      .eq('is_active', true) as { data: Card[] | null }

    // Determine search date (90 days ago if no previous sync)
    const afterDate = profile.last_gmail_sync_at
      ? Math.floor(new Date(profile.last_gmail_sync_at).getTime() / 1000)
      : Math.floor((Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000)

    for (const template of templates) {
      try {
        let query = `from:${template.sender_email} after:${afterDate}`
        if (template.subject_pattern) {
          query += ` subject:"${template.subject_pattern}"`
        }

        const listRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        )

        if (!listRes.ok) {
          errors.push(`Gmail API error for ${template.bank_name}: ${listRes.status}`)
          continue
        }

        const listData = await listRes.json()
        const messages: GmailMessage[] = listData.messages || []

        for (const msg of messages) {
          emailsProcessed++

          // Check for duplicate
          const { data: existing } = await supabase
            .from('transactions')
            .select('id')
            .eq('email_message_id', msg.id)
            .single()

          if (existing) continue

          // Fetch full message
          const msgRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          )

          if (!msgRes.ok) continue

          const msgDetail: GmailMessageDetail = await msgRes.json()
          const emailBody = decodeEmailBody(msgDetail)

          if (!emailBody) continue

          // Parse with AI
          const parsed = await parseEmail(emailBody, template.bank_name)

          if (!parsed.is_transaction) continue

          // Match card by last_four_digits
          let cardId: string | null = null
          if (parsed.card_last_four && cards) {
            const matchedCard = cards.find(
              (c) =>
                c.bank_name.toLowerCase() === template.bank_name.toLowerCase() &&
                c.last_four_digits === parsed.card_last_four
            )
            if (matchedCard) cardId = matchedCard.id
          }

          // If no specific card matched, use first active card for this bank
          if (!cardId && cards) {
            const bankCard = cards.find(
              (c) => c.bank_name.toLowerCase() === template.bank_name.toLowerCase()
            )
            if (bankCard) cardId = bankCard.id
          }

          if (!cardId) {
            errors.push(
              `Không tìm thấy thẻ phù hợp cho ${template.bank_name} (email: ${msg.id})`
            )
            continue
          }

          await supabase.from('transactions').insert({
            user_id: userId,
            card_id: cardId,
            amount: parsed.amount,
            merchant_name: parsed.merchant ?? null,
            transaction_date: parsed.transaction_date,
            transaction_time: parsed.transaction_time ?? null,
            source: 'email',
            status: 'pending_review',
            email_message_id: msg.id,
            cashback_earned: 0,
          })

          transactionsCreated++

          // Small delay to avoid rate limits
          await new Promise((r) => setTimeout(r, 50))
        }
      } catch (templateErr) {
        errors.push(
          `Lỗi xử lý ${template.bank_name}: ${templateErr instanceof Error ? templateErr.message : String(templateErr)}`
        )
      }
    }

    // Update sync log and profile
    await Promise.all([
      supabase
        .from('gmail_sync_logs')
        .update({
          status: errors.length > 0 && transactionsCreated === 0 ? 'failed' : 'completed',
          sync_completed_at: new Date().toISOString(),
          emails_processed: emailsProcessed,
          transactions_created: transactionsCreated,
          errors: errors.length > 0 ? errors : null,
        })
        .eq('id', syncLogId),
      supabase
        .from('profiles')
        .update({ last_gmail_sync_at: new Date().toISOString() })
        .eq('id', userId),
    ])

    return new Response(
      JSON.stringify({
        success: true,
        emails_processed: emailsProcessed,
        transactions_created: transactionsCreated,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    await supabase
      .from('gmail_sync_logs')
      .update({
        status: 'failed',
        sync_completed_at: new Date().toISOString(),
        emails_processed: emailsProcessed,
        transactions_created: transactionsCreated,
        errors: [errMsg, ...errors],
      })
      .eq('id', syncLogId)

    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
