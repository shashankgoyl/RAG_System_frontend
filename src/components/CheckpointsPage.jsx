import React, { useState, useEffect, useCallback } from 'react'
import { BookOpen, ChevronDown, ChevronRight, Filter, RefreshCw, AlertCircle } from 'lucide-react'
import { getCheckpoints, getCheckpointById } from '../api.js'

/* ── Single checkpoint card ────────────────────────────────────────────────── */
function CPCard({ cp }) {
  const [open,    setOpen]    = useState(false)
  const [detail,  setDetail]  = useState(null)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    if (!open && !detail) {
      setLoading(true)
      try {
        const r = await getCheckpointById(cp.id)
        setDetail(r.data)
      } catch { /* ignore */ } finally { setLoading(false) }
    }
    setOpen(o => !o)
  }

  return (
    <div
      className="card hover:border-gray-700 transition-colors cursor-pointer select-none"
      onClick={toggle}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-gray-500 flex-shrink-0">
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </span>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className={cp.type === 'topic' ? 'tag-topic' : 'tag-message'}>
              {cp.type === 'topic'
                ? `📌 Topic #${String(cp.topic_number).padStart(2, '0')}`
                : `📄 Window #${String(cp.window_number).padStart(2, '0')}`}
            </span>
            <span className="text-xs text-gray-500">
              msgs {cp.range} · {cp.message_count} messages
            </span>
          </div>

          {/* Summary */}
          <p className="text-sm text-gray-300 leading-relaxed">
            {(open && detail) ? detail.summary : cp.summary}
          </p>

          {/* Themes */}
          {cp.key_themes?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {cp.key_themes.map((t, i) => (
                <span key={i}
                  className="text-xs bg-gray-800 text-gray-400 border border-gray-700 rounded-full px-2 py-0.5">
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Expanded messages */}
          {open && detail?.messages && (
            <div className="mt-4 border-t border-gray-800 pt-4 space-y-1.5">
              <p className="text-xs text-gray-500 font-medium mb-2">Sample messages</p>
              {detail.messages.slice(0, 10).map((msg, i) => {
                const isU1 = msg.startsWith('User 1:')
                return (
                  <div key={i} className={`flex ${isU1 ? 'justify-start' : 'justify-end'}`}>
                    <span className={`max-w-[80%] text-xs rounded-xl px-3 py-1.5 ${
                      isU1 ? 'bg-gray-800 text-gray-300' : 'bg-brand-600/20 text-brand-300'
                    }`}>{msg}</span>
                  </div>
                )
              })}
              {detail.messages.length > 10 && (
                <p className="text-xs text-gray-600 text-center pt-1">
                  +{detail.messages.length - 10} more
                </p>
              )}
            </div>
          )}

          {loading && (
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
              <span className="w-3 h-3 border border-brand-400 border-t-transparent rounded-full animate-spin inline-block" />
              Loading…
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Page ──────────────────────────────────────────────────────────────────── */
export default function CheckpointsPage() {
  const [items,   setItems]   = useState([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [filter,  setFilter]  = useState('all')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const PAGE_SIZE = 15

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const r = await getCheckpoints({
        page, page_size: PAGE_SIZE,
        ...(filter !== 'all' ? { cp_type: filter } : {}),
      })
      setItems(r.data.checkpoints)
      setTotal(r.data.total)
    } catch (e) {
      setError(e.response?.data?.detail || e.message)
    } finally { setLoading(false) }
  }, [page, filter])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [filter])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-100">Checkpoints</h1>
            <p className="text-sm text-gray-500 mt-0.5">{total} total · click to expand</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={13} className="text-gray-500" />
            {[['all','All'],['topic','📌 Topic'],['message','📄 Message']].map(([v, label]) => (
              <button key={v} onClick={() => setFilter(v)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  filter === v
                    ? 'bg-brand-600/20 text-brand-300 border-brand-500/40'
                    : 'bg-gray-800/50 text-gray-400 border-gray-700 hover:border-gray-600'
                }`}>{label}</button>
            ))}
            <button onClick={load} className="btn-ghost p-1.5"><RefreshCw size={13} /></button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="card border-red-800 flex items-center gap-3 text-sm text-red-400">
            <AlertCircle size={15} />{error}
          </div>
        )}

        {/* Skeleton */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card animate-pulse space-y-2">
                <div className="h-3.5 bg-gray-800 rounded w-1/4" />
                <div className="h-3 bg-gray-800 rounded w-3/4" />
                <div className="h-3 bg-gray-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* List */}
        {!loading && !error && (
          <div className="space-y-3">
            {items.map(cp => <CPCard key={cp.id} cp={cp} />)}
            {items.length === 0 && (
              <div className="card text-center py-14 text-gray-600">
                <BookOpen size={28} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No checkpoints found. Run Setup first.</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <button disabled={page === 1}          onClick={() => setPage(p => p - 1)} className="btn-ghost text-sm disabled:opacity-30">← Prev</button>
            <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-ghost text-sm disabled:opacity-30">Next →</button>
          </div>
        )}

      </div>
    </div>
  )
}
