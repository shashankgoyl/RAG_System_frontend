import React, { useState, useEffect } from 'react'
import {
  User, Coffee, Sparkles, Heart, Users,
  MessageCircle, Brain, RefreshCw, AlertCircle,
} from 'lucide-react'
import { getPersona } from '../api.js'

/* ── Small helpers ─────────────────────────────────────────────────────────── */
function Section({ icon: Icon, title, accent, children }) {
  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg ${accent} flex items-center justify-center`}>
          <Icon size={14} className="text-white" />
        </div>
        <h3 className="text-sm font-semibold text-gray-100">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Tags({ items, color }) {
  if (!items?.length)
    return <p className="text-xs text-gray-600 italic">Nothing detected</p>
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t, i) => (
        <span key={i} className={`pill border border-white/10 ${color}`}>{t}</span>
      ))}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0 text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium text-gray-200">{value || '—'}</span>
    </div>
  )
}

function Bar({ label, value = 0 }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span><span>{Math.round(value * 100)}%</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-700"
          style={{ width: `${Math.min(value * 100, 100)}%` }}
        />
      </div>
    </div>
  )
}

/* ── Page ──────────────────────────────────────────────────────────────────── */
export default function PersonaPage() {
  const [persona, setPersona] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const r = await getPersona()
      setPersona(r.data)
    } catch (e) {
      setError(e.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-gray-500">
        <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Loading persona…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="card max-w-sm w-full text-center space-y-4">
        <AlertCircle size={28} className="text-red-400 mx-auto" />
        <p className="text-sm text-gray-400">{error}</p>
        <p className="text-xs text-gray-600">Run processing in Setup first.</p>
        <button onClick={load} className="btn-primary mx-auto flex items-center gap-2">
          <RefreshCw size={13} /> Retry
        </button>
      </div>
    </div>
  )

  const cs = persona?.communication_style || {}

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-100">User Persona</h1>
            <p className="text-xs text-gray-500 mt-1">Extracted from conversation signals — no guessing</p>
          </div>
          <button onClick={load} className="btn-ghost flex items-center gap-1.5 text-xs">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <Section icon={Coffee}       title="Habits"              accent="bg-amber-600">
            <Tags items={persona?.habits}              color="bg-amber-500/20 text-amber-300" />
          </Section>

          <Section icon={Sparkles}     title="Personality Traits"  accent="bg-violet-600">
            <Tags items={persona?.personality_traits}  color="bg-violet-500/20 text-violet-300" />
          </Section>

          <Section icon={Heart}        title="Interests"            accent="bg-pink-600">
            <Tags items={persona?.interests}           color="bg-pink-500/20 text-pink-300" />
          </Section>

          <Section icon={Users}        title="Relationships"        accent="bg-teal-600">
            <Tags items={persona?.relationships}       color="bg-teal-500/20 text-teal-300" />
          </Section>

          <Section icon={Brain}        title="Personal Facts"       accent="bg-blue-600">
            {persona?.personal_facts?.length
              ? <ul className="space-y-1.5">
                  {persona.personal_facts.map((f, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-300">
                      <span className="text-brand-400 mt-0.5 flex-shrink-0">▸</span>{f}
                    </li>
                  ))}
                </ul>
              : <p className="text-xs text-gray-600 italic">Nothing detected</p>
            }
          </Section>

          <Section icon={MessageCircle} title="Communication Style" accent="bg-indigo-600">
            <div className="space-y-0">
              <Row label="Tone"            value={cs.tone} />
              <Row label="Message length"  value={cs.message_length} />
              <Row label="Emoji usage"     value={cs.emoji_usage_heuristic || cs.emoji_usage} />
              <Row label="Avg chars / msg" value={cs.avg_message_length_chars} />
            </div>
            {(cs.exclamation_rate !== undefined) && (
              <div className="space-y-2 pt-2">
                <Bar label="Exclamation usage" value={cs.exclamation_rate} />
                <Bar label="Question asking"   value={cs.question_rate} />
              </div>
            )}
            {cs.notable_patterns?.length > 0 && (
              <Tags items={cs.notable_patterns} color="bg-indigo-500/20 text-indigo-300" />
            )}
          </Section>

        </div>

        {/* Raw JSON */}
        <details className="card">
          <summary className="text-sm text-gray-400 font-medium list-none cursor-pointer select-none flex items-center gap-2">
            <span className="text-brand-400 font-mono">{'{}'}</span> Raw JSON
          </summary>
          <pre className="mt-4 text-xs text-gray-400 overflow-x-auto bg-gray-950 rounded-lg p-4 font-mono leading-relaxed">
            {JSON.stringify(persona, null, 2)}
          </pre>
        </details>

      </div>
    </div>
  )
}
