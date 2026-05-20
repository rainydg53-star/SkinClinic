import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './AdminTreatmentRecordManagePage.css'
import { API_BASE_URL } from '@/config/api'

const PAGE_SIZE = 10

function AdminTreatmentRecordManagePage() {
  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [sortOrder, setSortOrder] = useState('desc')
  const [memberPage, setMemberPage] = useState({
    content: [],
    page: 0,
    size: PAGE_SIZE,
    totalPages: 0,
    totalElements: 0,
  })
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const loadMembers = async (
    page = 0,
    keywordParam = searchKeyword,
    sortParam = sortOrder,
  ) => {
    try {
      setErrorMessage('')
      setLoadingMembers(true)

      const query = new URLSearchParams({
        page: String(page),
        size: String(PAGE_SIZE),
        sort: sortParam,
      })

      if (keywordParam.trim()) {
        query.set('keyword', keywordParam.trim())
      }

      const response = await fetch(
        `${API_BASE_URL}/api/admin/treatment-records/members?${query.toString()}`,
        {
          method: 'GET',
          credentials: 'include',
        },
      )

      if (!response.ok) {
        throw new Error('회원 시술 기록 목록을 불러오지 못했습니다.')
      }

      const data = await response.json()
      setMemberPage({
        content: Array.isArray(data.content) ? data.content : [],
        page: Number(data.page || 0),
        size: Number(data.size || PAGE_SIZE),
        totalPages: Number(data.totalPages || 0),
        totalElements: Number(data.totalElements || 0),
      })
    } catch (error) {
      setErrorMessage(error.message)
      setMemberPage({
        content: [],
        page: 0,
        size: PAGE_SIZE,
        totalPages: 0,
        totalElements: 0,
      })
    } finally {
      setLoadingMembers(false)
    }
  }

  useEffect(() => {
    loadMembers(0, searchKeyword, sortOrder)
  }, [searchKeyword, sortOrder])

  const memberCountLabel = useMemo(() => {
    if (loadingMembers) return '회원 목록을 불러오는 중입니다...'
    return `총 ${memberPage.totalElements}명`
  }, [loadingMembers, memberPage.totalElements])

  const sortLabel = sortOrder === 'desc' ? '최신순' : '과거순'

  const handleSearchMembers = (event) => {
    event.preventDefault()
    setSearchKeyword(keyword)
  }

  const handleMovePage = (nextPage) => {
    if (nextPage < 0 || nextPage >= memberPage.totalPages) {
      return
    }

    loadMembers(nextPage, searchKeyword, sortOrder)
  }

  const handleToggleDateSort = () => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
  }

  return (
    <section className="admin-treatment-manage-page">
      <header className="admin-treatment-manage-header">
        <div>
          <h2>시술 기록 관리</h2>
          <p>
            진입 시 최신 시술일 순으로 10명씩 표시되며, 회원 선택 시 시술
            내역을 볼 수 있습니다.
          </p>
        </div>
        <Link
          to="/admin/treatment-records/new"
          className="admin-treatment-manage-create-btn"
        >
          시술 기록 등록
        </Link>
      </header>

      <form className="admin-treatment-manage-search" onSubmit={handleSearchMembers}>
        <input
          type="text"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="회원명 또는 아이디 검색"
        />
        <button type="submit" disabled={loadingMembers}>
          검색
        </button>
      </form>

      <p className="admin-treatment-manage-helper">{memberCountLabel}</p>
      {errorMessage && <p className="admin-treatment-manage-error">{errorMessage}</p>}

      <div className="admin-treatment-manage-records">
        <table>
          <thead>
            <tr>
              <th>회원 이름</th>
              <th>아이디</th>
              <th>시술명</th>
              <th>
                <button
                  type="button"
                  className="admin-treatment-date-sort-btn"
                  onClick={handleToggleDateSort}
                >
                  시술 날짜 ({sortLabel})
                </button>
              </th>
              <th>상세</th>
            </tr>
          </thead>
          <tbody>
            {memberPage.content.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-row">
                  조회된 회원이 없습니다.
                </td>
              </tr>
            ) : (
              memberPage.content.map((member) => (
                <tr key={member.memberId}>
                  <td>{member.memberName}</td>
                  <td>{member.loginId}</td>
                  <td>{member.latestProcedureName || '-'}</td>
                  <td>{member.latestTreatmentDate || '-'}</td>
                  <td>
                    {member.latestTreatmentRecordId ? (
                      <Link
                        to={`/admin/members/${member.memberId}/treatment-records/${member.latestTreatmentRecordId}`}
                      >
                        상세보기
                      </Link>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {memberPage.totalPages > 1 && (
        <div className="admin-treatment-manage-pagination">
          <button
            type="button"
            onClick={() => handleMovePage(memberPage.page - 1)}
            disabled={memberPage.page === 0 || loadingMembers}
          >
            이전
          </button>
          <span>
            {memberPage.page + 1} / {memberPage.totalPages}
          </span>
          <button
            type="button"
            onClick={() => handleMovePage(memberPage.page + 1)}
            disabled={memberPage.page + 1 >= memberPage.totalPages || loadingMembers}
          >
            다음
          </button>
        </div>
      )}
    </section>
  )
}

export default AdminTreatmentRecordManagePage
