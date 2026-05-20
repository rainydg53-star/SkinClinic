import { API_BASE_URL } from '@/config/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message = typeof data === 'object' && data?.message ? data.message : '요청에 실패했습니다.'
    const error = new Error(message)
    error.status = response.status
    error.data = data
    throw error
  }

  return { data }
}

const api = {
  get(path, options = {}) {
    const search = options.params
      ? `?${new URLSearchParams(
          Object.entries(options.params).reduce((acc, [key, value]) => {
            acc[key] = String(value)
            return acc
          }, {}),
        ).toString()}`
      : ''
    return request(`${path}${search}`, { method: 'GET' })
  },
  post(path, body) {
    return request(path, {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    })
  },
  patch(path, body) {
    return request(path, {
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  },
  delete(path) {
    return request(path, {
      method: 'DELETE',
    })
  },
}

export default api
