const DEFAULT_API_BASE_URL = 'http://localhost:8080'
const DEFAULT_PORTONE_SDK_URL = 'https://cdn.portone.io/v2/browser-sdk.js'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '')
export const PORTONE_SDK_URL = import.meta.env.VITE_PORTONE_SDK_URL || DEFAULT_PORTONE_SDK_URL
