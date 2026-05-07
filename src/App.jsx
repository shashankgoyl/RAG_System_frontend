import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { MessageSquare, User, BookOpen, Zap, Activity } from 'lucide-react'
import ChatPage        from './components/ChatPage.jsx'
import PersonaPage     from './components/PersonaPage.jsx'
import CheckpointsPage from './components/CheckpointsPage.jsx'
import SetupPage       from './components/SetupPage.jsx'
import { getStatus }   from './api.js'

const NAV = [
  { to: '/',            icon: MessageSquare, label: 'Chat'        },
  { to: '/persona',     icon: User,          label: 'Persona'     },
  { to: '/checkpoints', icon: BookOpen,      label: 'Checkpoints' },
  { to: '/setup',       icon: Zap,           label: 'Setup'       },
]

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    getStatus()
      .then(r => setReady(r.data.state === 'done'))
      .catch(() => setReady(false))
  }, [])

  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-gray-950">

        {/* ── Sidebar ───────────────────────────────────────────── */}
        <aside className="w-16 lg:w-56 flex-shrink-0 border-r border-gray-800 flex flex-col">

          {/* Logo */}
          <div className="h-14 flex items-center gap-3 px-4 border-b border-gray-800">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
              <Activity size={16} className="text-white" />
            </div>
            <span className="hidden lg:block font-semibold text-sm text-gray-100 tracking-tight">
              ConvoRAG
            </span>
          </div>

          {/* System status badge */}
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 text-xs text-gray-500">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ready ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {ready ? 'System ready' : 'Not processed'}
          </div>

          {/* Nav links */}
          <nav className="flex-1 px-2 pt-1 space-y-0.5">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm
                   ${isActive
                     ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                     : 'text-gray-400 hover:text-gray-100 hover:bg-white/5 border border-transparent'
                   }`
                }
              >
                <Icon size={17} className="flex-shrink-0" />
                <span className="hidden lg:block font-medium">{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-800 hidden lg:block">
            <p className="text-xs text-gray-600">Groq · LLaMA 3.3 70B</p>
          </div>
        </aside>

        {/* ── Main area ─────────────────────────────────────────── */}
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/"            element={<ChatPage systemReady={ready} />} />
            <Route path="/persona"     element={<PersonaPage />} />
            <Route path="/checkpoints" element={<CheckpointsPage />} />
            <Route path="/setup"       element={<SetupPage onReady={() => setReady(true)} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
