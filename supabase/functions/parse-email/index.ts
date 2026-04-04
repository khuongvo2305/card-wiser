import { GoogleGenAI } from 'npm:@google/genai'

const ai = new GoogleGenAI({ apiKey: Deno.env.get('GEMINI_API_KEY') })

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

    const prompt = `You are parsing Vietnamese bank transaction notification emails.
The email may be a FORWARDED message — if so, look inside the forwarded content for the original bank notification.
Extract transaction details and return a JSON object only — no extra text, no markdown.

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
- "Tên đơn vị" / "Ten don vi" / "tai" / "At:" = merchant name
- "Ngày GD" / "Ngay GD" / "Date" = transaction date
- "Thẻ" / "The" / "ending in" / "so cuoi" / "Card Number" = card last 4 digits
- "Số dư" / "So du" = available balance (ignore, not the transaction amount)
- Amounts formatted as: 1.500.000 VND or 1,500,000 VND or 1500000 or "25,000 VND"
- Forwarded email markers: "---------- Forwarded message ---------", "Fwd:", "Chuyển tiếp:"
- Bank: ${bank_name}

Email content:
${email_body}`

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0,
        maxOutputTokens: 512,
        responseMimeType: 'application/json',
      },
    })

    const text = (response.text ?? '').trim()

    let parsed: ParseResult
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = { is_transaction: false }
    }

    return new Response(JSON.stringify(parsed), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Parse failed'
    console.error('parse-email error:', msg)
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
})
