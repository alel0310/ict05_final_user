// src/lib/api.js
import axios from 'axios'

const API_BASE = process.env.REACT_APP_BACKEND_API_BASE_URL || ''
const API_PREFIX = process.env.REACT_APP_API_PREFIX || '/api'

export const api = axios.create({
  baseURL: `${API_BASE}${API_PREFIX}`,
})
