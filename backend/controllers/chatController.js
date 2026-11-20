import chatSessionModel from '../models/chatSessionModel.js'
import chatProvider, { quickReplies } from '../config/chatProvider.js'

const MAX_MESSAGES = 24
const MAX_MESSAGE_LENGTH = 4000

const normalizeHistory = (messages) => messages
  .filter((message) => message && ['user', 'assistant', 'system'].includes(message.role) && typeof message.content === 'string')
  .slice(-MAX_MESSAGES)
  .map((message) => ({ ...message, content: message.content.trim().slice(0, MAX_MESSAGE_LENGTH) }))

const getOrCreateSession = async (sessionId) => {
  let session = await chatSessionModel.findOne({ sessionId })
  if (!session) {
    session = await chatSessionModel.create({ sessionId, messages: [] })
  }
  return session
}

const getSession = async (req, res) => {
  try {
    const sessionId = req.params.sessionId || req.headers['x-chat-session']
    if (!sessionId) return res.status(400).json({ success: false, message: 'A chat session ID is required.' })
    const session = await getOrCreateSession(sessionId)
    res.json({ success: true, sessionId: session.sessionId, messages: session.messages, provider: chatProvider.getProviderName(), quickReplies })
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: 'Unable to load this chat session.' })
  }
}

const sendMessage = async (req, res) => {
  try {
    const { sessionId, message } = req.body
    if (!sessionId || !message?.trim()) {
      return res.status(400).json({ success: false, message: 'Session ID and message are required.' })
    }

    const session = await getOrCreateSession(sessionId)
    const userMessage = { role: 'user', content: String(message).trim().slice(0, MAX_MESSAGE_LENGTH) }
    const history = normalizeHistory([...session.messages, userMessage])

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders?.()

    const sendEvent = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    sendEvent('session', { sessionId: session.sessionId, provider: chatProvider.getProviderName() })

    let answer = ''
    try {
      for await (const token of chatProvider.streamReply(history)) {
        answer += token
        sendEvent('token', { token })
      }
      answer = answer.trim() || 'I am available to help with Mediconnect navigation and general health information.'
    } catch (error) {
      console.log('AI chat provider:', error.message)
      answer = `${chatProvider.getFallbackReply(userMessage.content)}\n\n_The live AI provider is unavailable, so this response uses Mediconnect’s built-in guidance._`
      sendEvent('token', { token: answer })
    }

    if (answer.endsWith('_live AI provider is unavailable, so this response uses Mediconnect’s built-in guidance._')) {
      answer = answer.replace('Mediconnect AI', 'Mediconnect Assistant')
    }

    session.messages = normalizeHistory([...session.messages, userMessage, { role: 'assistant', content: answer }])
    session.lastMessageAt = new Date()
    await session.save()
    sendEvent('done', { sessionId: session.sessionId, provider: chatProvider.getProviderName() })
    res.end()
  } catch (error) {
    console.log(error)
    if (res.headersSent) return res.end()
    res.status(500).json({ success: false, message: 'Unable to send this message.' })
  }
}

const resetSession = async (req, res) => {
  try {
    const sessionId = req.params.sessionId || req.body.sessionId
    if (!sessionId) return res.status(400).json({ success: false, message: 'A chat session ID is required.' })
    const session = await getOrCreateSession(sessionId)
    session.messages = []
    session.lastMessageAt = new Date()
    await session.save()
    res.json({ success: true, sessionId: session.sessionId, messages: [], provider: chatProvider.getProviderName(), quickReplies })
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: 'Unable to reset this chat session.' })
  }
}

export { getSession, sendMessage, resetSession }