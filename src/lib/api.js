import axios from 'axios'

// Base API instance
const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bis_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const { response, config } = error

    // Only redirect on 401 if it's NOT a chat query endpoint
    const isChatUrl = config?.url?.includes('/chat/')
    if (response?.status === 401 && !isChatUrl) {
      localStorage.removeItem('bis_token')
      localStorage.removeItem('bis_user')
      // Redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    const message =
      response?.data?.error ||
      response?.data?.message ||
      error.message ||
      'Something went wrong'

    return Promise.reject(new Error(message))
  }
)

// ── Auth API ──
export const authApi = {
  login:    (data) => api.post('/auth/login',    data),
  register: (data) => api.post('/auth/register', data),
  logout:   ()     => api.post('/auth/logout'),
  me:       ()     => api.get('/auth/me'),
}

// ── Chat API ──
export const chatApi = {
  query:       (data)      => api.post('/chat/query',          data),
  getSessions: ()          => api.get('/chat/sessions'),
  getMessages: (sessionId) => api.get(`/chat/sessions/${sessionId}/messages`),
  deleteSession:(sessionId)=> api.delete(`/chat/sessions/${sessionId}`),
}

// ── Admin API ──
export const adminApi = {
  getUsers:    (params) => api.get('/admin/users',     { params }),
  createUser:  (data)   => api.post('/admin/users',    data),
  updateUser:  (id, d)  => api.put(`/admin/users/${id}`, d),
  deleteUser:  (id)     => api.delete(`/admin/users/${id}`),
  getAuditLog: (params) => api.get('/admin/audit-log', { params }),
  getDocs:     (params) => api.get('/admin/knowledge', { params }),
  uploadDoc:   (data)   => api.post('/admin/knowledge', data),
  updateDoc:   (id, d)  => api.put(`/admin/knowledge/${id}`, d),
  deleteDoc:   (id)     => api.delete(`/admin/knowledge/${id}`),
  getStats:    ()       => api.get('/admin/stats'),
}

// ── Consumer API ──
export const consumerApi = {
  getDashboard:  ()       => api.get('/consumer/dashboard'),
  getStandards:  (params) => api.get('/consumer/standards',  { params }),
  getHallmarking:(params) => api.get('/consumer/hallmarking',{ params }),
  getComplaints: ()       => api.get('/consumer/complaints'),
  fileComplaint: (data)   => api.post('/consumer/complaints', data),
}

// ── Manufacturer API ──
export const manufacturerApi = {
  getDashboard:    ()       => api.get('/manufacturer/dashboard'),
  getCertifications:(params)=> api.get('/manufacturer/certifications', { params }),
  applyForCert:    (data)   => api.post('/manufacturer/certifications', data),
  getDocuments:    ()       => api.get('/manufacturer/documents'),
  uploadDocument:  (data)   => api.post('/manufacturer/documents', data),
}

export default api
