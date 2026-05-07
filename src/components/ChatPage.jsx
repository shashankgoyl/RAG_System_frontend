import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, ChevronDown, AlertCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { sendChat } from '../api.js'

const SUGGESTIONS = [
  'What kind of person is this user?',
  'What are their habits?',
  'How do they communicate?',
  'What are their interests?',
  'What personal facts do we know?',
  'What topics did they discuss most?',
]

/* ── Source accordion ──────────────────────────────────────────────────────── */
function SourceCard({ src }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="text-xs border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-800/60 hover:bg-gray-800 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className={src.type === 'topic' ? 'tag-topic' : 'tag-message'}>
            {src.type === 'topic' ? `📌 Topic ${src.id.split('_')[1]}` : `📄 ${src.range}`}
          </span>
          <span className="text-gray-500">score {src.score.toFixed(2)}</span>
        </span>
        <ChevronDown size={13} className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <p className="px-3 py-2 text-gray-400 bg-gray-900/60 leading-relaxed">{src.summary}</p>
      )}
    </div>
  )
}

/* ── Single message bubble ─────────────────────────────────────────────────── */
function Bubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 msg-enter ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot size={14} className="text-white" />
        </div>
      )}

      <div className={`max-w-[680px] flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Bubble */}
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-brand-600 text-white rounded-br-sm'
            : 'bg-gray-800 text-gray-100 rounded-bl-sm'
        }`}>
          {isUser ? (
            msg.content
          ) : (
            <ReactMarkdown
              components={{
                p:      ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="text-brand-300 font-semibold">{children}</strong>,
                ul:     ({ children }) => <ul className="list-disc list-inside space-y-1 my-1">{children}</ul>,
                li:     ({ children }) => <li>{children}</li>,
                code:   ({ children }) => <code className="bg-gray-700 px-1 rounded font-mono text-xs">{children}</code>,
              }}
            >
              {msg.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Sources */}
        {msg.sources?.length > 0 && (
          <div className="w-full space-y-1">
            <p className="text-xs text-gray-600 px-0.5">
              {msg.sources.length} source{msg.sources.length > 1 ? 's' : ''} used
            </p>
            {msg.sources.map((s, i) => <SourceCard key={i} src={s} />)}
          </div>
        )}

        {/* Error */}
        {msg.error && (
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            <AlertCircle size={13} /> {msg.error}
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
          <User size={14} className="text-gray-300" />
        </div>
      )}
    </div>
  )
}

/* ── Typing indicator ──────────────────────────────────────────────────────── */
function Typing() {
  return (
    <div className="flex gap-3 msg-enter">
      <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
        <Bot size={14} className="text-white" />
      </div>
      <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
        <span className="dot-pulse text-brand-400 flex gap-1">
          <span /><span /><span />
        </span>
      </div>
    </div>
  )
}

/* ── Chat Page ─────────────────────────────────────────────────────────────── */
export default function ChatPage({ systemReady }) {
  const initMsg = {
    role: 'assistant',
    content: systemReady
      ? "Hi! Ask me anything about the user — their habits, personality, communication style, or topics they discussed."
      : "⚠️ The system hasn't been set up yet. Head to **Setup** and run the processing first.",
  }
  const [messages, setMessages] = useState([initMsg])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const bottomRef = useRef(null)
  const textRef   = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text) => {
    const q = (text || input).trim()
    if (!q || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)
    try {
      const res = await sendChat(q, true)
      setMessages(prev => [...prev, {
        role:    'assistant',
        content: res.data.answer,
        sources: res.data.sources || [],
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role:    'assistant',
        content: 'Something went wrong answering that question.',
        error:   err.response?.data?.detail || err.message,
      }])
    } finally {
      setLoading(false)
      textRef.current?.focus()
    }
  }

  return (
    <div className="h-full flex flex-col">

      {/* Header */}
      <header className="h-14 flex-shrink-0 flex items-center justify-between px-6 border-b border-gray-800">
        <div>
          <p className="font-semibold text-sm text-gray-100">Conversation Intelligence</p>
          <p className="text-xs text-gray-500">Powered by Groq · LLaMA 3.3 70B</p>
        </div>
        <span className={`pill ${systemReady
          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          : 'bg-amber-500/20  text-amber-300  border border-amber-500/30'}`}>
          {systemReady ? '● Ready' : '● Not ready'}
        </span>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {messages.map((m, i) => <Bubble key={i} msg={m} />)}
        {loading && <Typing />}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips (shown only at start) */}
      {messages.length <= 2 && !loading && (
        <div className="px-6 pb-3">
          <p className="text-xs text-gray-600 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-xs text-gray-400 bg-gray-800/70 hover:bg-gray-700
                           border border-gray-700 rounded-full px-3 py-1.5 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-gray-800">
        <div className="flex gap-3 items-end">
          <textarea
            ref={textRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
            placeholder="Ask about the user's habits, personality, topics…"
            disabled={loading}
            className="input resize-none leading-6 min-h-[44px] max-h-[120px]"
            style={{ height: '44px' }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="btn-primary h-11 w-11 flex items-center justify-center flex-shrink-0 !px-0 rounded-xl"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs text-gray-700 mt-1.5">↵ Send · Shift+↵ New line</p>
      </div>
    </div>
  )
}
