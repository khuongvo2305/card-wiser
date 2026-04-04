import Anthropic from 'npm:@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
})

interface ParseEmailRequest {
  email_body: string
  bank_name: string
}

interface ParsedTransaction {
  is_transaction: true
  amount: number
  merchant: string | null
  transaction_date: string
  transaction_time: string | null
  card_last_four: string | null
  transaction_type: 'purchase' | 'payment' | 'refund' | 'withdrawal'
}

interface NotTransaction {
  is_transaction: false
}

type ParseResult = ParsedTransaction | NotTransaction

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { email_body, bank_name }: ParseEmailRequest = await req.json()

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      system: `You are parsing Vietnamese bank transaction notification emails.
Extract transaction details and return a JSON object only — no extra text.

Required output format:
{
  "is_transaction": true,
  "amount": <number in VND, positive integer>,
  "merchant": <string or null>,
  "transaction_date": "<YYYY-MM-DD>",
  "transaction_time": "<HH:mm:ss> or null",
  "card_last_four": "<4-digit string or null>",
  "transaction_type": "purchase" | "payment" | "refund" | "withdrawal"
}

If this email is NOT a transaction notification, return: {"is_transaction": false}

Common Vietnamese patterns:
- "Số tiền" / "So tien" / "GD:" = transaction amount
- "Tên đơn vị" / "Ten don vi" / "tai" = merchant name
- "Ngày GD" / "Ngay GD" = transaction date
- "Thẻ" / "The" / "ending" = card number last 4 digits
- "Số dư" / "So du" = available balance (ignore, not the transaction amount)
- Amounts formatted as: 1.500.000 VND or 1,500,000 VND or 1500000
- Bank: ${bank_name}`,
      messages: [
        {
          role: 'user',
          content: email_body,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    let result: ParseResult
    try {
      result = JSON.parse(text)
    } catch {
      result = { is_transaction: false }
    }

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Parse failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
