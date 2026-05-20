import { useEffect, useMemo, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client/dist/sockjs'
import './AdminChatPage.css'
import { API_BASE_URL } from '@/config/api'

const LOCK_TTL_MS = 15000
const HEARTBEAT_MS = 5000
const HISTORY_PAGE_SIZE = 10

function AdminChatPage() {
  const [me, setMe] = useState(null)
  const [conversations, setConversations] = useState([])
  const [selectedUserLoginId, setSelectedUserLoginId] = useState('')
  const [sessions, setSessions] = useState([])
  const [historySessions, setHistorySessions] = useState([])
  const [historyPage, setHistoryPage] = useState(0)
  const [historyTotalPages, setHistoryTotalPages] = useState(0)
  const [selectedSessionId, setSelectedSessionId] = useState(null)
  const [viewMode, setViewMode] = useState('current')
  const [messages, setMessages] = useState([])
  const [content, setContent] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [connected, setConnected] = useState(false)
  const [hasSocketOwnership, setHasSocketOwnership] = useState(false)
  const [blockedByOtherSession, setBlockedByOtherSession] = useState(false)
  const [sessionClosedNotice, setSessionClosedNotice] = useState('')

  const stompClientRef = useRef(null)
  const subscriptionRef = useRef(null)
  const scrollRef = useRef(null)
  const tabIdRef = useRef(
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
  )

  const lockKey = useMemo(
    () => (me?.loginId ? `chat:lock:admin:${me.loginId}` : null),
    [me?.loginId],
  )

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.userLoginId === selectedUserLoginId),
    [conversations, selectedUserLoginId],
  )

  const filteredConversations = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()
    if (!keyword) {
      return conversations
    }

    return conversations.filter((conversation) => {
      const loginId = (conversation.userLoginId || '').toLowerCase()
      const userName = (conversation.userName || '').toLowerCase()
      const lastMessage = (conversation.lastMessage || '').toLowerCase()
      return loginId.includes(keyword) || userName.includes(keyword) || lastMessage.includes(keyword)
    })
  }, [conversations, searchKeyword])

  const currentSession = useMemo(
    () => sessions.find((session) => session.status === 'OPEN') || null,
    [sessions],
  )

  const sortedMessages = useMemo(
    () =>
      [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages],
  )

  const fetchConversations = async () => {
    const response = await fetch(`${API_BASE_URL}/api/admin/chat/conversations`, {
      credentials: 'include',
    })
    if (!response.ok) {
      throw new Error('상담 목록을 불러오지 못했습니다.')
    }

    const data = await response.json()
    setConversations(data)
    setSelectedUserLoginId((prevSelectedUserLoginId) => {
      if (data.length === 0) {
        return ''
      }

      if (
        prevSelectedUserLoginId &&
        data.some((conversation) => conversation.userLoginId === prevSelectedUserLoginId)
      ) {
        return prevSelectedUserLoginId
      }

      return data[0].userLoginId
    })
  }

  const fetchSessions = async (userLoginId) => {
    if (!userLoginId) {
      setSessions([])
      setSelectedSessionId(null)
      setMessages([])
      return []
    }

    const response = await fetch(
      `${API_BASE_URL}/api/admin/chat/users/${encodeURIComponent(userLoginId)}/sessions`,
      { credentials: 'include' },
    )

    if (!response.ok) {
      throw new Error('상담 세션 목록을 불러오지 못했습니다.')
    }

    const data = await response.json()
    setSessions(data)
    return data
  }

  const fetchSessionMessages = async (sessionId) => {
    const response = await fetch(`${API_BASE_URL}/api/admin/chat/sessions/${sessionId}/messages`, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('상담 메시지를 불러오지 못했습니다.')
    }

    setMessages(await response.json())
  }

  const fetchHistorySessions = async (userLoginId, page = 0) => {
    if (!userLoginId) {
      setHistorySessions([])
      setHistoryPage(0)
      setHistoryTotalPages(0)
      return []
    }

    const response = await fetch(
      `${API_BASE_URL}/api/admin/chat/users/${encodeURIComponent(userLoginId)}/sessions/history?page=${page}&size=${HISTORY_PAGE_SIZE}`,
      { credentials: 'include' },
    )

    if (!response.ok) {
      throw new Error('상담 내역 목록을 불러오지 못했습니다.')
    }

    const data = await response.json()
    const content = data.content || []
    setHistorySessions(content)
    setHistoryPage(data.page ?? page)
    setHistoryTotalPages(data.totalPages ?? 0)
    return content
  }

  const syncSessionView = async (userLoginId, preferredSessionId = null) => {
    const allSessions = await fetchSessions(userLoginId)

    const open = allSessions.find((session) => session.status === 'OPEN') || null
    if (viewMode === 'current') {
      if (open) {
        setSelectedSessionId(open.id)
        await fetchSessionMessages(open.id)
      } else {
        setSelectedSessionId(null)
        setMessages([])
      }
      return
    }

    const nextId = preferredSessionId && allSessions.some((s) => s.id === preferredSessionId)
      ? preferredSessionId
      : allSessions.find((s) => s.status === 'CLOSED')?.id

    await fetchHistorySessions(userLoginId, 0)

    if (nextId) {
      setSelectedSessionId(nextId)
      await fetchSessionMessages(nextId)
    } else {
      setSelectedSessionId(null)
      setMessages([])
    }
  }

  const moveToClosedSession = async (userLoginId, sessionId) => {
    if (!userLoginId) {
      return
    }

    const allSessions = await fetchSessions(userLoginId)
    await fetchHistorySessions(userLoginId, 0)
    const targetSessionId =
      sessionId && allSessions.some((session) => session.id === sessionId)
        ? sessionId
        : allSessions.find((session) => session.status === 'CLOSED')?.id ?? null

    setViewMode('history')
    setSelectedSessionId(targetSessionId)

    if (targetSessionId) {
      await fetchSessionMessages(targetSessionId)
      return
    }

    setMessages([])
  }

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const meResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
          credentials: 'include',
        })

        if (!meResponse.ok) {
          throw new Error('로그인 정보를 확인할 수 없습니다.')
        }

        setMe(await meResponse.json())
        await fetchConversations()
      } catch (error) {
        setErrorMessage(error.message)
      }
    }

    fetchInitial()

    const intervalId = setInterval(() => {
      fetchConversations().catch(() => {})
    }, 5000)

    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (!selectedUserLoginId) {
      setSessions([])
      setSelectedSessionId(null)
      setMessages([])
      return
    }

    syncSessionView(selectedUserLoginId).catch((error) => setErrorMessage(error.message))
  }, [selectedUserLoginId, viewMode])

  useEffect(() => {
    if (!lockKey) {
      return
    }

    const now = () => Date.now()

    const readLock = () => {
      const raw = localStorage.getItem(lockKey)
      if (!raw) {
        return null
      }

      try {
        return JSON.parse(raw)
      } catch {
        localStorage.removeItem(lockKey)
        return null
      }
    }

    const isExpired = (lock) => !lock?.expiresAt || lock.expiresAt <= now()

    const writeLock = () => {
      const nextLock = {
        tabId: tabIdRef.current,
        expiresAt: now() + LOCK_TTL_MS,
      }
      localStorage.setItem(lockKey, JSON.stringify(nextLock))
    }

    const claimOrRefresh = () => {
      const existing = readLock()

      if (!existing || isExpired(existing) || existing.tabId === tabIdRef.current) {
        writeLock()
        setHasSocketOwnership(true)
        return
      }

      setHasSocketOwnership(false)
    }

    const releaseIfOwner = () => {
      const existing = readLock()
      if (existing?.tabId === tabIdRef.current) {
        localStorage.removeItem(lockKey)
      }
    }

    claimOrRefresh()

    const heartbeatId = setInterval(() => {
      claimOrRefresh()
    }, HEARTBEAT_MS)

    const onStorage = (event) => {
      if (event.key !== lockKey) {
        return
      }
      claimOrRefresh()
    }

    const onBeforeUnload = () => {
      releaseIfOwner()
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      clearInterval(heartbeatId)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('beforeunload', onBeforeUnload)
      releaseIfOwner()
    }
  }, [lockKey])

  useEffect(() => {
    if (!hasSocketOwnership) {
      subscriptionRef.current?.unsubscribe()
      stompClientRef.current?.deactivate()
      stompClientRef.current = null
      setConnected(false)
      setBlockedByOtherSession(false)
      return
    }

    if (stompClientRef.current) {
      return
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws-chat`),
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true)
        setBlockedByOtherSession(false)
      },
      onStompError: (frame) => {
        setConnected(false)
        const reason = `${frame?.headers?.message || ''} ${frame?.body || ''}`
        if (
          reason.includes('SESSION_LIMIT_EXCEEDED') ||
          reason.includes('WebSocket session limit exceeded')
        ) {
          setBlockedByOtherSession(true)
        }
      },
      onWebSocketClose: () => setConnected(false),
    })

    client.activate()
    stompClientRef.current = client

    return () => {
      setConnected(false)
      subscriptionRef.current?.unsubscribe()
      client.deactivate()
      stompClientRef.current = null
    }
  }, [hasSocketOwnership])

  useEffect(() => {
    if (!hasSocketOwnership || !connected || !stompClientRef.current || !selectedUserLoginId) {
      return
    }

    subscriptionRef.current?.unsubscribe()

    subscriptionRef.current = stompClientRef.current.subscribe(
      `/topic/consultation/${selectedUserLoginId}`,
      (frame) => {
        const incoming = JSON.parse(frame.body)

        if (incoming.eventType === 'SESSION_CLOSED') {
          setSessionClosedNotice('상담이 종료되었습니다. 상담 내역 보기로 전환되었습니다.')
          moveToClosedSession(selectedUserLoginId, incoming.sessionId).catch(() => {})
          fetchConversations().catch(() => {})
          return
        }

        if (!selectedSessionId || selectedSessionId === incoming.sessionId) {
          setMessages((prev) => [...prev, incoming])
        }

        syncSessionView(selectedUserLoginId, incoming.sessionId).catch(() => {})
      },
    )

    return () => {
      subscriptionRef.current?.unsubscribe()
    }
  }, [hasSocketOwnership, connected, selectedUserLoginId, selectedSessionId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [sortedMessages])

  const handleSelectHistory = async (sessionId) => {
    setSessionClosedNotice('')
    setViewMode('history')
    setSelectedSessionId(sessionId)

    try {
      await fetchSessionMessages(sessionId)
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleHistoryPageChange = async (nextPage) => {
    if (!selectedUserLoginId) {
      return
    }

    try {
      const nextSessions = await fetchHistorySessions(selectedUserLoginId, nextPage)
      if (nextSessions.length === 0) {
        setSelectedSessionId(null)
        setMessages([])
        return
      }

      setSelectedSessionId(nextSessions[0].id)
      await fetchSessionMessages(nextSessions[0].id)
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleMoveCurrent = async () => {
    setSessionClosedNotice('')
    setViewMode('current')

    if (!currentSession?.id) {
      setSelectedSessionId(null)
      setMessages([])
      return
    }

    setSelectedSessionId(currentSession.id)

    try {
      await fetchSessionMessages(currentSession.id)
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleCloseCurrentSession = async () => {
    if (!currentSession?.id) {
      return
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/chat/sessions/${currentSession.id}/close`,
        {
          method: 'POST',
          credentials: 'include',
        },
      )

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || '상담 종료에 실패했습니다.')
      }

      setSessionClosedNotice('상담이 종료되었습니다. 상담 내역 보기로 전환되었습니다.')
      await moveToClosedSession(selectedUserLoginId, data.id)
      fetchConversations().catch(() => {})
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const sendMessage = async () => {
    const trimmed = content.trim()
    if (!trimmed || !selectedUserLoginId || !hasSocketOwnership || blockedByOtherSession || viewMode !== 'current') {
      return
    }

    setErrorMessage('')
    setSessionClosedNotice('')
    setContent('')

    try {
      if (stompClientRef.current?.connected) {
        stompClientRef.current.publish({
          destination: '/app/consultation/send',
          body: JSON.stringify({
            toLoginId: selectedUserLoginId,
            content: trimmed,
          }),
        })
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ toLoginId: selectedUserLoginId, content: trimmed }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || '메시지 전송에 실패했습니다.')
      }

      if (!selectedSessionId || selectedSessionId === data.sessionId) {
        setMessages((prev) => [...prev, data])
      }

      syncSessionView(selectedUserLoginId, data.sessionId).catch(() => {})
    } catch (error) {
      setErrorMessage(error.message)
      setContent(trimmed)
    }
  }

  return (
    <section className="admin-chat-page">
      <header className="admin-chat-header">
        <h2>1:1 상담 관리</h2>
        <span className={`admin-chat-conn ${connected ? 'on' : 'off'}`}>
          {!hasSocketOwnership || blockedByOtherSession
            ? '다른 기기/탭에서 사용 중'
            : connected
              ? '실시간 연결됨'
              : '재연결 중'}
        </span>
      </header>

      {(!hasSocketOwnership || blockedByOtherSession) && (
        <p className="admin-chat-lock-notice">
          현재 탭은 읽기 전용입니다. 다른 기기/탭의 상담을 종료하면 자동으로 활성화됩니다.
        </p>
      )}

      {errorMessage && <p className="admin-chat-error">{errorMessage}</p>}
      {sessionClosedNotice && <p className="admin-chat-inline-notice">{sessionClosedNotice}</p>}

      <div className="admin-chat-layout">
        <aside className="admin-chat-conversations">
          <div className="admin-chat-search">
            <input
              type="text"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="회원명, 아이디, 메시지 검색"
            />
          </div>

          {filteredConversations.length === 0 ? (
            <p className="empty">
              {searchKeyword.trim() ? '검색 결과가 없습니다.' : '아직 상담 내역이 없습니다.'}
            </p>
          ) : (
            filteredConversations.map((conversation) => (
              <button
                key={conversation.userLoginId}
                type="button"
                className={selectedUserLoginId === conversation.userLoginId ? 'active' : ''}
                onClick={() => {
                  setSelectedUserLoginId(conversation.userLoginId)
                  setSessionClosedNotice('')
                  setViewMode('current')
                }}
              >
                <strong>
                  {conversation.userName || conversation.userLoginId}
                  {conversation.unreadCount > 0 && (
                    <span className="admin-chat-unread-badge">{conversation.unreadCount}</span>
                  )}
                </strong>
                <span>ID: {conversation.userLoginId}</span>
                <span>{conversation.lastMessage}</span>
              </button>
            ))
          )}
        </aside>

        <section className="admin-chat-room">
          <div className="room-title">
            {selectedConversation
              ? `${selectedConversation.userName || selectedConversation.userLoginId} 님 상담`
              : '상담을 선택하세요'}
          </div>

          {selectedUserLoginId && (
            <div className="admin-chat-session-controls">
              <button
                type="button"
                className={viewMode === 'current' ? 'active' : ''}
                onClick={handleMoveCurrent}
              >
                {currentSession?.id ? '진행중 상담' : '상담 시작'}
              </button>
              <button
                type="button"
                className={viewMode === 'history' ? 'active' : ''}
                onClick={() => {
                  setViewMode('history')
                  setHistoryPage(0)
                  fetchHistorySessions(selectedUserLoginId, 0).then((loaded) => {
                    if (loaded.length > 0) {
                      handleSelectHistory(loaded[0].id)
                    } else {
                      setSelectedSessionId(null)
                      setMessages([])
                    }
                  }).catch((error) => setErrorMessage(error.message))
                }}
              >
                상담 내역
              </button>

              {viewMode === 'current' && currentSession?.id && (
                <button
                  type="button"
                  className="admin-chat-close-btn"
                  onClick={handleCloseCurrentSession}
                  disabled={!hasSocketOwnership || blockedByOtherSession}
                >
                  상담 종료
                </button>
              )}
            </div>
          )}

          {selectedUserLoginId && viewMode === 'history' && (
            <>
              <div className="admin-chat-history-list">
                {historySessions.length === 0 ? (
                  <p className="admin-chat-history-empty">종료된 상담 내역이 없습니다.</p>
                ) : (
                  historySessions.map((session) => (
                    <button
                      key={session.id}
                      type="button"
                      className={selectedSessionId === session.id ? 'active' : ''}
                      onClick={() => handleSelectHistory(session.id)}
                    >
                      <strong>상담 #{session.id}</strong>
                      <span>{new Date(session.createdAt).toLocaleString('ko-KR')}</span>
                      {session.closedAt && <span>종료: {new Date(session.closedAt).toLocaleString('ko-KR')}</span>}
                    </button>
                  ))
                )}
              </div>

              {historyTotalPages > 1 && (
                <div className="admin-chat-history-pagination">
                  <button
                    type="button"
                    onClick={() => handleHistoryPageChange(historyPage - 1)}
                    disabled={historyPage <= 0}
                  >
                    이전
                  </button>
                  <span>{historyPage + 1} / {historyTotalPages}</span>
                  <button
                    type="button"
                    onClick={() => handleHistoryPageChange(historyPage + 1)}
                    disabled={historyPage >= historyTotalPages - 1}
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          )}

          <div className="room-messages" ref={scrollRef}>
            {sortedMessages.length === 0 ? (
              <p className="admin-chat-empty">
                {viewMode === 'current'
                  ? '진행중 상담 메시지가 없습니다.'
                  : '선택한 상담 내역에 메시지가 없습니다.'}
              </p>
            ) : (
              sortedMessages.map((message) => (
                <div
                  key={`${message.id}-${message.createdAt}`}
                  className={`room-bubble ${message.senderLoginId === selectedUserLoginId ? 'user' : 'admin'}`}
                >
                  <strong>{message.senderName || message.senderLoginId}</strong>
                  <p>{message.content}</p>
                  <span>{new Date(message.createdAt).toLocaleString('ko-KR')}</span>
                </div>
              ))
            )}
          </div>

          <div className="room-input">
            <input
              type="text"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && sendMessage()}
              placeholder={viewMode === 'current' ? '답변을 입력하세요' : '상담이 종료 되었습니다.'}
              disabled={
                !selectedUserLoginId ||
                !hasSocketOwnership ||
                blockedByOtherSession ||
                viewMode !== 'current'
              }
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={
                !selectedUserLoginId ||
                !hasSocketOwnership ||
                blockedByOtherSession ||
                viewMode !== 'current'
              }
            >
              전송
            </button>
          </div>
        </section>
      </div>
    </section>
  )
}

export default AdminChatPage


