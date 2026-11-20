import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true, trim: true, maxlength: 4000 },
  createdAt: { type: Date, default: Date.now }
}, { _id: false })

const chatSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, default: null },
  messages: { type: [messageSchema], default: [] },
  lastMessageAt: { type: Date, default: Date.now }
}, { timestamps: true })

chatSessionSchema.index({ lastMessageAt: -1 })

const chatSessionModel = mongoose.models.chatSession || mongoose.model('chatSession', chatSessionSchema)

export default chatSessionModel