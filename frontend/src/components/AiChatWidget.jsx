import React, { useContext, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import logo from '../assets/logo.PNG'

const SESSION_KEY = 'mediconnect_chat_session_id'
const WELCOME = {
  role: 'assistant',
  content: 'Hi, I’m your Mediconnect care assistant. I can help you find the right doctor, book care, understand payments, or explore our services.'
}
const SUGGESTIONS = [
  'Find a doctor',
  'Book an appointment',
  'How do payments work?',
  'Explore careers'
]

const createLocalId = () => crypto.randomUUID()
const loadHistory = () => {
  try {
    const value = JSON.parse(sessionStorage.getItem('mediconnect_chat_messages'))
    return Array.isArray(value) && value.length ? value : [WELCOME]
  } catch {
    return [WELCOME]
  }
}

const AiChatWidget = () => {
  const { backendUrl } = useContext(AppContext)
  const navigate = useNavigate()
  const [sessionId, setSessionId] = useState(localStorage.getItem(SESSION_KEY) || '')
  const [messages, setMessages] = useState(loadHistory)
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  const [provider, setProvider] = useState('Mediconnect Assistant')
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const existing = localStorage.getItem(SESSION_KEY)
    if (existing) {
      setSessionId(existing)
      axios.get(`${backendUrl}/api/chat/session/${existing}`)
        .then(({ data }) => {
          if (data.success) {
            setProvider(data.provider)
            if (data.messages?.length > 1) setMessages(data.messages.map((message, index) => ({ ...message, id: `${existing}-${index}` })))
          }
        })
        .catch(() => {})
      return
    }
    const newSession = `med_${createLocalId()}`
    localStorage.setItem(SESSION_KEY, newSession)
    setSessionId(newSession)
  }, [])

  useEffect(() => {
    sessionStorage.setItem('mediconnect_chat_messages', JSON.stringify(messages.slice(-30)))
    if (open) requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }))
  }, [messages, open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 220)
  }, [open])

  const showMessage = (message) => setMessages((current) => [...current, message])

  const sendMessage = async (text) => {
    const messageText = String(text || input).trim()
    if (!messageText || loading) return
    setError('')
    setInput('')
    showMessage({ id: createLocalId(), role: 'user', content: messageText })
    setLoading(true)
    setStarting(true)

    const assistantId = createLocalId()
    let streamed = ''
    setMessages((current) => [...current, { id: assistantId, role: 'assistant', content: '' }])

    try {
      let activeSession = sessionId
      if (!activeSession) {
        const response = await axios.post(`${backendUrl}/api/chat/session`, {})
        activeSession = response.data.sessionId
        localStorage.setItem(SESSION_KEY, activeSession)
        setSessionId(activeSession)
      }

      const response = await fetch(`${backendUrl}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ sessionId: activeSession, message: messageText })
      })
      if (!response.ok || !response.body) throw new Error('The Mediconnect assistant is unavailable.')
      setStarting(false)

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
          const data = event.split(/\n/).find((line) => line.startsWith('data: '))?.slice(6)
          if (!data) continue
          const payload = JSON.parse(data)
          if (payload.token) {
            streamed += payload.token
            setMessages((current) => current.map((item) => item.id === assistantId ? { ...item, content: streamed } : item))
          }
          if (payload.sessionId) {
            localStorage.setItem(SESSION_KEY, payload.sessionId)
            setSessionId(payload.sessionId)
          }
          if (payload.provider) setProvider(payload.provider)
        }
      }
    } catch (caughtError) {
      console.log(caughtError)
      setError(caughtError.response?.data?.message || 'The assistant could not continue. Please try again.')
      setMessages((current) => current.filter((item) => item.id !== assistantId || item.content))
    } finally {
      setLoading(false)
      setStarting(false)
    }
  }

  const resetChat = async () => {
    if (!sessionId) return
    try {
      await axios.post(`${backendUrl}/api/chat/reset/${sessionId}`)
      setMessages([WELCOME])
      setError('')
    } catch {
      setError('Could not start a new conversation. Please refresh and try again.')
    }
  }

  const handleSuggestion = (suggestion) => {
    if (/doctors?/i.test(suggestion)) {
      navigate('/doctors')
      setOpen(false)
      return
    }
    if (/appointment/i.test(suggestion)) {
      navigate('/doctors')
      setOpen(false)
      return
    }
    if (/career/i.test(suggestion)) {
      navigate('/careers')
      setOpen(false)
      return
    }
    sendMessage(suggestion)
  }

  return (
    <>
      <button className={`ai-chat-launcher ${open ? 'is-open' : ''}`} onClick={() => setOpen((value) => !value)} aria-label={open ? 'Close Mediconnect AI chat' : 'Chat with Mediconnect AI'} type='button'>
        <span className='ai-chat-launcher__pulse'></span>
        {open ? <span className='ai-chat-launcher__close'>×</span> : <img src={logo} alt='' />}
      </button>

      <section className={`ai-chat-panel ${open ? 'is-open' : ''}`} aria-label='Mediconnect AI chat' aria-hidden={!open}>
        <header className='ai-chat-header'>
          <div className='ai-chat-brand'>
            <div className='ai-chat-brand__mark'><img src={logo} alt='' /></div>
            <div>
              <div className='ai-chat-brand__title'>{provider} <span>BETA</span></div>
              <div className='ai-chat-brand__status'><i></i> Online · {provider.includes('Assistant') ? 'Built-in guidance' : 'Session protected'}</div>
            </div>
          </div>
          <div className='ai-chat-header__actions'>
            <button onClick={resetChat} type='button' aria-label='Start a new chat' title='New chat'>↻</button>
            <button onClick={() => setOpen(false)} type='button' aria-label='Close chat' className='ai-chat-close'>×</button>
          </div>
        </header>

        <div className='ai-chat-session'><span>SESSION</span> {sessionId ? `${sessionId.slice(0, 18)}...` : 'Creating secure session'}</div>

        <div className='ai-chat-messages' ref={scrollRef} aria-live='polite'>
          <div className='ai-chat-date'><span>Today</span></div>
          {messages.map((message) => (
            <div className={`ai-message ai-message--${message.role}`} key={message.id || message.content}>
              {message.role === 'assistant' && <div className='ai-message__avatar'><img src={logo} alt='' /></div>}
              <div className='ai-message__bubble'>
                {message.content ? (
                  <div className='ai-message__text'>{message.content.split(/(\n|\*\*)/).map((part, index) => {
                    if (part === '\n') return <br key={`${message.id}-${index}`} />
                    if (part === '**') return null
                    const previous = message.content.split(/(\n|\*\*)/)[index - 1]
                    const next = message.content.split(/(\n|\*\*)/)[index + 1]
                    return previous === '**' && next === '**' ? <strong key={`${message.id}-${index}`}>{part}</strong> : <React.Fragment key={`${message.id}-${index}`}>{part}</React.Fragment>
                  })}</div>
                ) : starting && loading ? <div className='ai-typing'><span></span><span></span><span></span><em>Mediconnect AI is thinking</em></div> : null}
              </div>
            </div>
          ))}
          {error && <div className='ai-chat-error'>{error}</div>}
        </div>

        <div className='ai-chat-suggestions'>
          {SUGGESTIONS.map((suggestion) => <button key={suggestion} onClick={() => handleSuggestion(suggestion)} type='button' disabled={loading}>{suggestion}</button>)}
        </div>

        <form className='ai-chat-composer' onSubmit={(event) => { event.preventDefault(); sendMessage() }}>
          <div className='ai-chat-composer__field'>
            <span className='ai-chat-spark'>✦</span>
            <textarea ref={inputRef} rows='1' value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage() } }} placeholder='Ask about care, doctors, or appointments...' disabled={loading} aria-label='Message Mediconnect AI' />
            <button className='ai-chat-send' type='submit' disabled={loading || !input.trim()} aria-label='Send message'>{loading ? <span className='ai-chat-send__spinner'></span> : <span>↑</span>}</button>
          </div>
          <p className='ai-chat-disclaimer'>AI can make mistakes. For emergencies, contact local emergency services.</p>
        </form>
      </section>
    </>
  )
}

export default AiChatWidget