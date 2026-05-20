import api from './apiClient'

export const getUserNotifications = async (userId, type = 'ALL') => {
  const response = await api.get(`/api/notifications/users/${userId}`, {
    params: type === 'ALL' ? {} : { type },
  })
  return response.data
}

export const getUnreadNotificationCount = async (userId) => {
  const response = await api.get(`/api/notifications/users/${userId}/unread-count`)
  return response.data
}

export const markNotificationAsRead = async (notificationId) => {
  const response = await api.patch(`/api/notifications/${notificationId}/read`)
  return response.data
}

export const triggerMyNotification = async (payload) => {
  const response = await api.post('/api/notifications/me/test', payload)
  return response.data
}

export const markNotificationAsKakaoSent = async (notificationId) => {
  const response = await api.patch(`/api/notifications/${notificationId}/kakao-sent`)
  return response.data
}

export const getAllNotifications = async (type = 'ALL') => {
  const response = await api.get('/api/admin/notifications', {
    params: type === 'ALL' ? {} : { type },
  })
  return response.data
}

export const getNotificationMembers = async () => {
  const response = await api.get('/api/admin/notifications/members')
  return response.data
}

export const createNotification = async (payload) => {
  const response = await api.post('/api/admin/notifications', payload)
  return response.data
}

export const triggerNotificationEvent = async (payload) => {
  const response = await api.post('/api/admin/notifications/events', payload)
  return response.data
}
