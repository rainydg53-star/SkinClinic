import { useState } from "react";
import { adminGetSkinDiagnoses, adminGetSkinDiagnosisDetail } from "@/api/skinDiagnosisApi";
import "./admin-skin-diagnosis.css";

function concernLabel(value) {
  if (!value) return "-";
  return value;
}

export default function AdminSkinDiagnosisPage() {
  const [memberId, setMemberId] = useState("");
  const [list, setList] = useState([]);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadList = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await adminGetSkinDiagnoses(memberId ? Number(memberId) : undefined);
      setList(Array.isArray(data) ? data : []);
      setDetail(null);
    } catch (err) {
      setError(err.message || "진단 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const showDetail = async (id) => {
    try {
      setError("");
      const data = await adminGetSkinDiagnosisDetail(id);
      setDetail(data);
    } catch (err) {
      setError(err.message || "진단 상세를 불러오지 못했습니다.");
    }
  };

  return (
    <div className="admin-skin-diagnosis-page">
      <header className="admin-skin-diagnosis-header">
        <h2>피부진단결과 관리</h2>
      </header>

      {error ? <div className="admin-skin-diagnosis-error">{error}</div> : null}

      <section className="admin-skin-diagnosis-card">
        <div className="admin-skin-diagnosis-filter">
          <label htmlFor="member-id-input">회원 ID (선택)</label>
          <input
            id="member-id-input"
            type="number"
            min="1"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            placeholder="비우면 전체 조회"
          />
          <button type="button" onClick={loadList} disabled={loading}>
            {loading ? "조회 중..." : "조회"}
          </button>
        </div>
      </section>

      {list.length > 0 ? (
        <section className="admin-skin-diagnosis-card">
          <h3>진단 목록</h3>
          <ul className="admin-skin-diagnosis-list">
            {list.map((item) => (
              <li key={item.diagnosisId}>
                <button type="button" onClick={() => showDetail(item.diagnosisId)}>
                  <strong>진단 #{item.diagnosisId}</strong>
                  <span>회원 #{item.memberId}</span>
                  <span>{item.skinTypeResult || "-"}</span>
                  <span>{item.createdAt?.slice(0, 10) || "-"}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {detail ? (
        <section className="admin-skin-diagnosis-card">
          <h3>진단 상세</h3>
          <p>회원 ID: {detail.memberId}</p>
          <p>피부 타입: {detail.skinTypeResult || "-"}</p>
          <p>주요 고민: {concernLabel(detail.mainConcern)}</p>
          <p>코멘트: {detail.overallComment || "-"}</p>

          <div className="admin-skin-diagnosis-region">
            <h4>부위별 상태</h4>
            {(detail.regions || []).length === 0 ? (
              <p>부위 데이터가 없습니다.</p>
            ) : (
              <ul>
                {detail.regions.map((region, index) => (
                  <li key={`${region.region}-${index}`}>
                    <strong>{region.region}</strong>
                    <span>{region.conditionText || "-"}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button type="button" className="close-btn" onClick={() => setDetail(null)}>
            닫기
          </button>
        </section>
      ) : null}
    </div>
  );
}
