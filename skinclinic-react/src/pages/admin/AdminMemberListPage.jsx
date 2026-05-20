import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './AdminMemberListPage.css'
import { API_BASE_URL } from '@/config/api'

function AdminMemberListPage() {
  const [members, setMembers] = useState([])
  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    fetchMembers()
  }, [searchKeyword])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      setErrorMessage('')

      const query = searchKeyword.trim() ? `?keyword=${encodeURIComponent(searchKeyword)}` : ''

      const res = await fetch(`${API_BASE_URL}/api/admin/members${query}`, {
        method: 'GET',
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error('회원 목록 조회에 실패했습니다.')
      }

      const data = await res.json()
      setMembers(data)
    } catch (error) {
      console.error(error)
      setErrorMessage(error.message || '회원 목록 조회 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setSearchKeyword(keyword)
  }

  if (loading) {
    return <div className="admin-member-page">로딩 중...</div>
  }

  return (
    <div className="admin-member-page">
      <div className="admin-member-header">
        <h2>회원 관리</h2>
        <p>전체 회원 목록을 조회하고 권한을 관리할 수 있습니다.</p>
      </div>

      <form className="admin-member-search-form" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="이름 또는 아이디 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button type="submit">검색</button>
      </form>

      {errorMessage && <p className="admin-member-error">{errorMessage}</p>}

      <div className="admin-member-table-wrap">
        <table className="admin-member-table">
          <thead>
            <tr>
              <th>번호</th>
              <th>아이디</th>
              <th>이름</th>
              <th>이메일</th>
              <th>휴대폰번호</th>
              <th>권한</th>
              <th>상세</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-row">
                  회원이 없습니다.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id}>
                  <td>{member.id}</td>
                  <td>{member.loginId}</td>
                  <td>{member.name}</td>
                  <td>{member.email}</td>
                  <td>{member.phone}</td>
                  <td>{member.role}</td>
                  <td>
                    <Link to={`/admin/members/${member.id}`} className="detail-link">
                      상세보기
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminMemberListPage
