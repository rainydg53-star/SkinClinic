import { useEffect, useMemo, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client/dist/sockjs'
import { useSearchParams } from 'react-router-dom'
import './UserConsultationChatPage.css'
import { API_BASE_URL } from '@/config/api'

const LOCK_TTL_MS = 15000
const HEARTBEAT_MS = 5000
const HISTORY_PAGE_SIZE = 10

function UserConsultationChatPage() {
  const [searchParams] = useSearchParams()
  const [me, setMe] = useState(null)
  const [messages, setMessages] = useState([])
  const [content, setContent] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [connected, setConnected] = useState(false)
  const [hasSocketOwnership, setHasSocketOwnership] = useState(false)
  const [blockedByOtherSession, setBlockedByOtherSession] = useState(false)
  const [sessionClosedNotice, setSessionClosedNotice] = useState('')
  const [isStartingSession, setIsStartingSession] = useState(false)

  const [currentSession, setCurrentSession] = useState(null)
  const [historySessions, setHistorySessions] = useState([])
  const [historyPage, setHistoryPage] = useState(0)
  const [historyTotalPages, setHistoryTotalPages] = useState(0)
  const [selectedSessionId, setSelectedSessionId] = useState(null)
  const [sessionDisplayNoById, setSessionDisplayNoById] = useState({})
  const [viewMode, setViewMode] = useState('current')

  const stompClientRef = useRef(null)
  const scrollRef = useRef(null)
  const tabIdRef = useRef(
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
  )

  const lockKey = useMemo(
    () => (me?.loginId ? `chat:lock:user:${me.loginId}` : null),
    [me?.loginId],
  )

  const currentSessionId = currentSession?.id ?? null
  const requestedSessionId = useMemo(() => {
    const raw = searchParams.get('sessionId')
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? parsed : null
  }, [searchParams])
  const requestedHistoryMode = searchParams.get('mode') === 'history'

  const sortedMessages = useMemo(
    () =>
      [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages],
  )

  const fetchCurrentSession = async () => {
    const response = await fetch(`${API_BASE_URL}/api/chat/sessions/current`, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('현재 상담 정보를 불러오지 못했습니다.')
    }

    const raw = await response.text()
    const data = raw ? JSON.parse(raw) : null
    setCurrentSession(data)
    return data
  }

  const fetchSessions = async () => {
    const response = await fetch(`${API_BASE_URL}/api/chat/sessions`, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('상담 세션 목록을 불러오지 못했습니다.')
    }

    const data = await response.json()
    const sorted = [...data].sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime()
      const tb = new Date(b.createdAt || 0).getTime()
      if (ta !== tb) return ta - tb
      return (a.id || 0) - (b.id || 0)
    })
    const indexMap = {}
    sorted.forEach((session, index) => {
      indexMap[session.id] = index + 1
    })
    setSessionDisplayNoById(indexMap)
    return data
  }

  const getSessionDisplayNo = (sessionId) => sessionDisplayNoById[sessionId] || sessionId

  const fetchCurrentMessages = async () => {
    const response = await fetch(`${API_BASE_URL}/api/chat/messages`, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('상담 내역을 불러오지 못했습니다.')
    }

    setMessages(await response.json())
  }

  const fetchSessionMessages = async (sessionId) => {
    const response = await fetch(`${API_BASE_URL}/api/chat/sessions/${sessionId}/messages`, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('상담 내역을 불러오지 못했습니다.')
    }

    setMessages(await response.json())
  }

  const fetchHistorySessions = async (page = 0) => {
    const response = await fetch(
      `${API_BASE_URL}/api/chat/sessions/history?page=${page}&size=${HISTORY_PAGE_SIZE}`,
      {
        credentials: 'include',
      },
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

  const refreshSessionState = async (preferredSessionId = null, forceHistory = false) => {
    const [current, allSessions] = await Promise.all([fetchCurrentSession(), fetchSessions()])

    if (preferredSessionId && allSessions.some((session) => session.id === preferredSessionId)) {
      setViewMode('history')
      setSelectedSessionId(preferredSessionId)
      await fetchHistorySessions(0)
      await fetchSessionMessages(preferredSessionId)
      return
    }

    if (current?.id && !forceHistory) {
      setViewMode('current')
      setSelectedSessionId(current.id)
      await fetchCurrentMessages()
      return
    }

    if (allSessions.length > 0) {
      const targetSessionId = selectedSessionId && allSessions.some((s) => s.id === selectedSessionId)
        ? selectedSessionId
        : allSessions[0].id
      setViewMode('history')
      setSelectedSessionId(targetSessionId)
      await fetchHistorySessions(0)
      await fetchSessionMessages(targetSessionId)
      return
    }

    setHistorySessions([])
    setHistoryPage(0)
    setHistoryTotalPages(0)
    setMessages([])
    setSelectedSessionId(null)
  }

  const handleSessionClosedEvent = async (sessionId) => {
    setSessionClosedNotice('상담이 종료되었습니다. 상담 내역에서 확인할 수 있습니다.')
    setCurrentSession(null)
    setViewMode('history')

    try {
      const allSessions = await fetchSessions()
      await fetchHistorySessions(0)
      const targetSessionId =
        sessionId && allSessions.some((session) => session.id === sessionId)
          ? sessionId
          : allSessions.find((session) => session.status === 'CLOSED')?.id ?? null

      setSelectedSessionId(targetSessionId)

      if (targetSessionId) {
        await fetchSessionMessages(targetSessionId)
      } else {
        setMessages([])
      }
    } catch {
      setMessages([])
    }
  }

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const meRes = await fetch(`${API_BASE_URL}/api/auth/me`, { credentials: 'include' })

        if (!meRes.ok) {
          throw new Error('로그인 정보를 확인할 수 없습니다.')
        }

        setMe(await meRes.json())
        await refreshSessionState(requestedSessionId, requestedHistoryMode)
      } catch (error) {
        setErrorMessage(error.message)
      }
    }

    fetchInitial()
  }, [requestedSessionId, requestedHistoryMode])

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
    if (!me?.loginId || !hasSocketOwnership) {
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
        client.subscribe(`/topic/consultation/${me.loginId}`, (frame) => {
          const message = JSON.parse(frame.body)

          if (message.eventType === 'SESSION_CLOSED') {
            handleSessionClosedEvent(message.sessionId).catch(() => {})
            return
          }

          if (!currentSessionId || currentSessionId === message.sessionId) {
            setMessages((prev) => [...prev, message])
          }

          if (!currentSessionId && message.sessionId) {
            setCurrentSession((prev) =>
              prev || {
                id: message.sessionId,
                status: 'OPEN',
              },
            )
            setSelectedSessionId(message.sessionId)
            setViewMode('current')
          }

          fetchSessions().catch(() => {})
        })
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
      client.deactivate()
      stompClientRef.current = null
    }
  }, [me?.loginId, hasSocketOwnership, currentSessionId])

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
    try {
      const nextSessions = await fetchHistorySessions(nextPage)
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

    if (!currentSessionId) {
      setMessages([])
      return
    }

    setSelectedSessionId(currentSessionId)
    try {
      await fetchCurrentMessages()
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleCloseCurrentSession = async () => {
    if (!currentSessionId) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/sessions/current/close`, {
        method: 'POST',
        credentials: 'include',
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || '상담 종료에 실패했습니다.')
      }

      await handleSessionClosedEvent(data.id)
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleStartSession = async () => {
    if (!hasSocketOwnership || blockedByOtherSession || viewMode !== 'current' || isStartingSession) {
      return
    }

    setErrorMessage('')
    setSessionClosedNotice('')
    setIsStartingSession(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/sessions/current/start`, {
        method: 'POST',
        credentials: 'include',
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || '상담 시작에 실패했습니다.')
      }

      setCurrentSession(data)
      setSelectedSessionId(data.id)
      setViewMode('current')
      setMessages([])
      await fetchCurrentMessages()
      fetchSessions().catch(() => {})
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsStartingSession(false)
    }
  }

  const sendMessage = async () => {
    const trimmed = content.trim()
    if (!trimmed || !hasSocketOwnership || blockedByOtherSession || viewMode !== 'current') {
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
            content: trimmed,
          }),
        })

        return
      }

      const response = await fetch(`${API_BASE_URL}/api/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: trimmed }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || '메시지 전송에 실패했습니다.')
      }

      if (!currentSessionId && data.sessionId) {
        setCurrentSession((prev) =>
          prev || {
            id: data.sessionId,
            status: 'OPEN',
          },
        )
        setSelectedSessionId(data.sessionId)
        setViewMode('current')
      }

      setMessages((prev) => [...prev, data])
      fetchSessions().catch(() => {})
    } catch (error) {
      setErrorMessage(error.message)
      setContent(trimmed)
    }
  }

  if (errorMessage && !me) {
    return <div className="chat-page-status error">{errorMessage}</div>
  }

  return (
    <section className="chat-page">
      <div className="chat-card">
        <div className="chat-header">
          <h2>1:1 상담</h2>
          <span className={`chat-connection ${connected ? 'on' : 'off'}`}>
            {!hasSocketOwnership || blockedByOtherSession
              ? '다른 기기/탭에서 사용 중'
              : connected
                ? '실시간 연결됨'
                : '재연결 중'}
          </span>
        </div>

        {(!hasSocketOwnership || blockedByOtherSession) && (
          <p className="chat-lock-notice">
            현재 탭은 읽기 전용입니다. 다른 기기/탭의 상담을 종료하면 자동으로 활성화됩니다.
          </p>
        )}

        <div className="chat-session-controls">
          <button
            type="button"
            className={viewMode === 'current' ? 'active' : ''}
            onClick={handleMoveCurrent}
          >
            {currentSessionId ? '진행중 상담' : '상담 시작'}
          </button>
          <button
            type="button"
            className={viewMode === 'history' ? 'active' : ''}
            onClick={() => {
              setViewMode('history')
              setHistoryPage(0)
              if (historySessions.length > 0) {
                handleSelectHistory(historySessions[0].id)
              } else {
                fetchHistorySessions(0).then((loaded) => {
                  if (loaded.length > 0) {
                    handleSelectHistory(loaded[0].id)
                  } else {
                    setSelectedSessionId(null)
                    setMessages([])
                  }
                }).catch((error) => setErrorMessage(error.message))
              }
            }}
          >
            상담 내역
          </button>

          {viewMode === 'current' && currentSessionId && (
            <button
              type="button"
              className="chat-close-btn"
              onClick={handleCloseCurrentSession}
              disabled={!hasSocketOwnership || blockedByOtherSession}
            >
              상담 종료
            </button>
          )}
        </div>

        {viewMode === 'history' && (
          <>
            <div className="chat-history-list">
              {historySessions.length === 0 ? (
                <p className="chat-history-empty">종료된 상담 내역이 없습니다.</p>
              ) : (
                historySessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    className={selectedSessionId === session.id ? 'active' : ''}
                    onClick={() => handleSelectHistory(session.id)}
                  >
                    <strong>상담 #{getSessionDisplayNo(session.id)}</strong>
                    <span>{new Date(session.createdAt).toLocaleString('ko-KR')}</span>
                    {session.closedAt && <span>종료: {new Date(session.closedAt).toLocaleString('ko-KR')}</span>}
                  </button>
                ))
              )}
            </div>

            {historyTotalPages > 1 && (
              <div className="chat-history-pagination">
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

        {errorMessage && <p className="chat-inline-error">{errorMessage}</p>}
        {sessionClosedNotice && <p className="chat-inline-notice">{sessionClosedNotice}</p>}

        <div className="chat-messages" ref={scrollRef}>
          {sortedMessages.length === 0 ? (
            viewMode === 'current' && !currentSessionId ? (
              <div className="chat-start-box">
                <p className="chat-empty">진행중 상담이 없습니다. 버튼을 눌러 상담을 시작해 주세요.</p>
                <button
                  type="button"
                  className="chat-start-btn"
                  onClick={handleStartSession}
                  disabled={!hasSocketOwnership || blockedByOtherSession || isStartingSession}
                >
                  {isStartingSession ? '시작 중...' : '상담 시작'}
                </button>
              </div>
            ) : (
              <p className="chat-empty">
                {viewMode === 'current'
                  ? '상담 메시지를 남기면 관리자에게 바로 전달됩니다.'
                  : '선택한 상담 내역에 메시지가 없습니다.'}
              </p>
            )
          ) : (
            sortedMessages.map((message) => (
              <div
                key={`${message.id}-${message.createdAt}`}
                className={`chat-bubble ${message.senderLoginId === me?.loginId ? 'mine' : 'theirs'}`}
              >
                <strong>{message.senderName || message.senderLoginId}</strong>
                <p>{message.content}</p>
                <span>{new Date(message.createdAt).toLocaleString('ko-KR')}</span>
              </div>
            ))
          )}
        </div>

        <div className="chat-input-row">
          <input
            type="text"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && sendMessage()}
            placeholder={
              viewMode === 'current'
                ? currentSessionId
                  ? '문의 내용을 입력하세요'
                  : '상담 시작 버튼을 눌러주세요'
                : '상담이 종료 되었습니다.'
            }
            disabled={!hasSocketOwnership || blockedByOtherSession || viewMode !== 'current' || !currentSessionId}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!hasSocketOwnership || blockedByOtherSession || viewMode !== 'current' || !currentSessionId}
          >
            전송
          </button>
        </div>
      </div>
    </section>
  )
}

export default UserConsultationChatPage




