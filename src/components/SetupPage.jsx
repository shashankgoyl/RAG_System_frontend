import React, { useState, useEffect, useRef } from 'react'
import {
  Zap, CheckCircle, XCircle, Loader,
  Terminal, Eye, EyeOff, RefreshCw,
} from 'lucide-react'
import { startProcessing, getStatus } from '../api.js'

const POLL_MS = 3000

export default function SetupPage({ onReady }) {
  const [apiKey,    setApiKey]    = useState('')
  const [showKey,   setShowKey]   = useState(false)
  const [status,    setStatus]    = useState(null)
  const [starting,  setStarting]  = useState(false)
  const [error,     setError]     = useState(null)
  const logRef  = useRef(null)
  const pollRef = useRef(null)

  const poll = async () => {
    try {
      const r = await getStatus()
      setStatus(r.data)
      if (r.data.state === 'done') onReady?.()
      return r.data.state
    } catch { return null }
  }

  useEffect(() => { poll() }, [])

  useEffect(() => {
    if (logRef.current)
      logRef.current.scrollTop = logRef.current.scrollHeight
  }, [status?.progress_log?.length])

  const startPoll = () => {
    clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      const s = await poll()
      if (s === 'done' || s === 'error') clearInterval(pollRef.current)
    }, POLL_MS)
  }

  useEffect(() => () => clearInterval(pollRef.current), [])

  const handleStart = async () => {
    setStarting(true); setError(null)
    try {
      await startProcessing(apiKey || undefined)
      startPoll()
    } catch (e) {
      setError(e.response?.data?.detail || e.message)
    } finally { setStarting(false) }
  }

  const stateColor = { idle:'text-gray-400', running:'text-amber-400', done:'text-emerald-400', error:'text-red-400' }
  const stateIcon  = {
    idle: null,
    running: <Loader size={15} className="animate-spin" />,
    done:    <CheckCircle size={15} />,
    error:   <XCircle size={15} />,
  }

  const HOW = [
    ['Load CSV',               'Parse all conversations → flat chronological message stream'],
    ['Topic Detection',        'Sliding-window TF-IDF similarity detects topic changes → topic checkpoints'],
    ['100-Msg Checkpoints',   'Every 100 messages → independent fixed-window summary'],
    ['TF-IDF Index',           'Vectorise all summaries for fast query-time retrieval'],
    ['Persona Extraction',     'Groq LLM analyses message batches → structured JSON persona'],
  ]

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-100">Setup & Processing</h1>
          <p className="text-sm text-gray-500 mt-1">
            Process the dataset once to enable RAG and persona extraction.
          </p>
        </div>

        {/* How it works */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-200">How it works</h2>
          {HOW.map(([title, desc], i) => (
            <div key={i} className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-brand-600/30 text-brand-400 text-xs font-bold
                               flex items-center justify-center flex-shrink-0">{i + 1}</span>
              <div>
                <p className="text-sm font-medium text-gray-200">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* API key */}
        <div className="card space-y-3">
          <label className="text-sm font-medium text-gray-200">
            Groq API Key
            <span className="ml-2 text-xs text-gray-500 font-normal">(skip if set in backend .env)</span>
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="gsk_…"
              className="input pr-10"
            />
            <button
              onClick={() => setShowKey(o => !o)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <p className="text-xs text-gray-600">
            Get a free key at <span className="text-brand-400 font-mono">console.groq.com</span>
          </p>
        </div>

        {/* Status panel */}
        {status && (
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-200">System Status</h3>
              <div className={`flex items-center gap-1.5 text-sm font-semibold ${stateColor[status.state] || 'text-gray-400'}`}>
                {stateIcon[status.state]}
                {status.state?.toUpperCase()}
              </div>
            </div>

            {status.stats && Object.keys(status.stats).length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Total Messages',      status.stats.total_messages?.toLocaleString()],
                  ['Topic Checkpoints',   status.stats.topic_checkpoints],
                  ['Message Checkpoints', status.stats.message_checkpoints],
                  ['Index Ready',         status.stats.is_indexed ? '✓ Yes' : '✗ No'],
                ].map(([l, v]) => (
                  <div key={l} className="bg-gray-800/50 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-500">{l}</p>
                    <p className="text-sm font-bold text-gray-100 mt-0.5">{v ?? '—'}</p>
                  </div>
                ))}
              </div>
            )}

            {status.message && (
              <p className="text-xs text-gray-400">{status.message}</p>
            )}
          </div>
        )}

        {/* Progress log */}
        {status?.progress_log?.length > 0 && (
          <div className="card space-y-2">
            <p className="flex items-center gap-2 text-sm font-semibold text-gray-200">
              <Terminal size={14} /> Processing Log
            </p>
            <div
              ref={logRef}
              className="bg-gray-950 rounded-lg p-3 h-52 overflow-y-auto font-mono text-xs space-y-0.5"
            >
              {status.progress_log.map((line, i) => (
                <div key={i} className={
                  line.includes('DONE')  || line.includes('✅')  ? 'text-emerald-400' :
                  line.includes('Error') || line.includes('⚠')   ? 'text-red-400'     :
                  line.includes('TOPIC') ? 'text-violet-400'  :
                  line.includes('PERSONA') ? 'text-amber-400' :
                  line.includes('INDEX') ? 'text-cyan-400'    :
                  'text-gray-400'
                }>{line}</div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="card border-red-800 flex items-center gap-3 text-sm text-red-400">
            <XCircle size={15} /> {error}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleStart}
          disabled={starting || status?.state === 'running'}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm"
        >
          {(starting || status?.state === 'running')
            ? <><Loader size={15} className="animate-spin" /> Processing…</>
            : status?.state === 'done'
              ? <><RefreshCw size={15} /> Reprocess Dataset</>
              : <><Zap size={15} /> Start Processing</>
          }
        </button>

        <p className="text-xs text-gray-600 text-center">
          Processing ~5 000 messages takes 3–5 min. The log updates automatically.
        </p>
      </div>
    </div>
  )
}
