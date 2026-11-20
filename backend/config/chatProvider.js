import crypto from 'crypto'

const SYSTEM_PROMPT = `You are Mediconnect AI, a warm, concise healthcare navigation assistant for the Mediconnect patient app. Help users understand booking appointments, finding doctors, payments, cancellations, profile settings, careers, and general health information. Never diagnose, prescribe medication, or replace a clinician. For urgent or emergency symptoms, tell the user to contact local emergency services immediately. If a request needs account-specific data, explain what to check in the app rather than inventing records. Format short answers in readable Markdown and use bullet points for steps.`

const quickReplies = [
  'Book a doctor appointment',
  'How do payments work?',
  'Find the right specialist',
  'Cancel an appointment'
]

class ChatProvider {
  constructor() {
    this.provider = (process.env.AI_PROVIDER || 'auto').toLowerCase()
    this.apiKey = process.env.OPENAI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY
    this.isTokenHarbor = this.apiKey?.startsWith('thk_live_') || this.provider === 'tokenharbor'
    if (this.isTokenHarbor) {
      this.provider = 'tokenharbor'
      this.baseUrl = process.env.AI_BASE_URL || 'https://tokenharbor.ai/v1'
      this.model = process.env.AI_MODEL || 'gpt-6-luna'
    } else {
      this.model = process.env.AI_MODEL || 'gpt-4.1-mini'
      this.baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1'
    }
  }

  createSessionId() {
    return `med_${crypto.randomUUID()}`
  }

  getProviderName() {
    if (!this.apiKey) return 'Mediconnect Assistant'
    if (this.provider === 'gemini' || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY) return 'Mediconnect Gemini AI'
    if (this.isTokenHarbor) return 'Mediconnect Token Harbor AI'
    return 'Mediconnect Live AI'
  }

  getHeaders() {
    if (this.isTokenHarbor) return { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` }
    if (this.provider === 'gemini' || (!process.env.OPENAI_API_KEY && (process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY))) {
      return { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey }
    }
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` }
  }

  async *streamReply(messages) {
    if (!this.apiKey) {
      const fallback = this.getFallbackReply(messages[messages.length - 1]?.content || '')
      for (const token of fallback.match(/\S+\s*/g) || [fallback]) {
        await new Promise((resolve) => setTimeout(resolve, 18))
        yield token
      }
      return
    }

    const isGemini = this.provider === 'gemini' || (!process.env.OPENAI_API_KEY && (process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY))
    const endpoint = isGemini
      ? `${this.baseUrl.replace(/\/$/, '')}/models/${this.model}:streamGenerateContent?alt=sse`
      : `${this.baseUrl.replace(/\/$/, '')}/chat/completions`
    const body = isGemini
      ? {
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: messages.filter((message) => message.role !== 'system').map((message) => ({
            role: message.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: message.content }]
          }))
        }
      : {
          model: this.model,
          stream: true,
          temperature: 0.55,
          max_tokens: 700,
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages.filter((message) => message.role !== 'system')]
        }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(45000)
    })

    if (!response.ok || !response.body) {
      const detail = await response.text()
      throw new Error(`AI provider request failed (${response.status}): ${detail.slice(0, 240)}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const events = buffer.split(/\n\n/)
      buffer = events.pop() || ''
      for (const event of events) {
        const data = event.split(/\n/).filter((line) => line.startsWith('data: ')).map((line) => line.slice(6)).join('\n')
        if (!data || data === '[DONE]') continue
        try {
          const parsed = JSON.parse(data)
          const token = isGemini
            ? parsed.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || ''
            : parsed.choices?.[0]?.delta?.content || ''
          if (token) yield token
        } catch {
          // Provider streams may include comments or partial keepalive events.
        }
      }
    }
  }

  getFallbackReply(message) {
    const text = message.toLowerCase()
    if (/(emergency|chest pain|can't breathe|cannot breathe|suicide|unconscious)/.test(text)) {
      return '**This may be an emergency.** Please contact your local emergency number or go to the nearest emergency department now. I can help with non-urgent Mediconnect navigation, but I cannot assess urgent medical symptoms.'
    }
    if (/(book|appointment|schedule)/.test(text)) {
      return 'You can book care in a few steps:\n\n1. Open **Doctors** from the main menu.\n2. Choose a speciality and doctor.\n3. Select an available date and time.\n4. Confirm your details and complete payment if required.\n\nWould you like help choosing a speciality?'
    }
    if (/(cancel|reschedule)/.test(text)) {
      return 'Open **My Appointments**, find the booking, and use **Cancel appointment**. For rescheduling, book a new available slot after cancelling. Refund timing depends on the payment method and appointment policy.'
    }
    if (/(pay|payment|razorpay|refund)/.test(text)) {
      return 'Mediconnect uses the secure Razorpay checkout for online payments. After payment, the appointment status should show **Paid**. If money was debited but the status did not update, contact support with your payment reference.'
    }
    if (/(doctor|specialist|speciality)/.test(text)) {
      return 'Start with the symptom or the type of care you need. **General physicians** are a good first stop for broad concerns, while specialists focus on areas such as skin, heart, brain, child health, or digestive health. For severe or emergency symptoms, seek urgent in-person care.'
    }
    if (/(job|career|hiring|apply)/.test(text)) {
      return 'Visit **Careers** from the patient app navigation. You can browse open roles, choose **Apply now**, and submit your details and resume.'
    }
    return 'I can help you navigate Mediconnect, understand appointment steps, payments, cancellations, doctor specialties, and careers. For personal medical advice, please consult a licensed clinician.'
  }
}

export { SYSTEM_PROMPT, quickReplies }
export default new ChatProvider()