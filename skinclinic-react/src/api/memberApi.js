import api from '@/api/apiClient'

export async function getMyMemberInfo() {
  const response = await api.get('/api/members/me')
  return response.data
}

