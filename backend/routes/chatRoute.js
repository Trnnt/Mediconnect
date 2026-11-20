import express from 'express'
import { getSession, resetSession, sendMessage } from '../controllers/chatController.js'

const chatRouter = express.Router()

chatRouter.post('/session', (req, res) => {
  const sessionId = req.body?.sessionId || `med_${globalThis.crypto.randomUUID()}`
  res.json({ success: true, sessionId })
})
chatRouter.get('/session/:sessionId', getSession)
chatRouter.post('/message', sendMessage)
chatRouter.post('/reset/:sessionId', resetSession)

export default chatRouter