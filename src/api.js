import axios from 'axios'

// In dev, Vite proxy forwards /api → localhost:8000
// In prod (Netlify), netlify.toml redirects /api → Render backend
const BASE_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({ baseURL: BASE_URL, timeout: 90000 })

export const checkHealth      = ()                    => api.get('/api/health')
export const getStatus        = ()                    => api.get('/api/status')
export const startProcessing  = (key)                 => api.post('/api/process', { groq_api_key: key })
export const sendChat         = (question, sources)   => api.post('/api/chat',    { question, include_sources: sources ?? true })
export const getPersona       = ()                    => api.get('/api/persona')
export const getCheckpoints   = (params)              => api.get('/api/checkpoints', { params })
export const getCheckpointById= (id)                  => api.get(`/api/checkpoints/${id}`)
export const getMessages      = (start = 0, count = 20) => api.get('/api/messages', { params: { start, count } })

export default api
