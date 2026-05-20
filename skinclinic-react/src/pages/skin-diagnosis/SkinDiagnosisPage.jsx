import { useEffect, useState } from "react";
import { getMyMemberInfo } from "@/api/memberApi";
import {
  getMySkinDiagnoses,
} from "@/api/skinDiagnosisApi";
import "./SkinDiagnosisPage.css";

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

export default function SkinDiagnosisPage({ embedded = false, autoRefreshToken = 0 }) {
  const [memberId, setMemberId] = useState(null);
  const [myList, setMyList] = useState([]);
  const [checkingMember, setCheckingMember] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        const me = await getMyMemberInfo();
        setMemberId(me.id);
      } catch {
        setMemberId(null);
        setMyList([]);
      } finally {
        setCheckingMember(false);
      }
    };
    init();
  }, []);

  const loadMyList = async () => {
    if (!memberId) return;
    setError("");
    try {
      const data = await getMySkinDiagnoses(memberId);
      setMyList(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "진단 목록을 불러오지 못했습니다.");
      setMyList([]);
    }
  };

  useEffect(() => {
    if (!memberId) return;
    loadMyList();
  }, [memberId, autoRefreshToken]);

  const content = (
    <>
      {error ? <div className="skin-diagnosis-error">{error}</div> : null}

      <section className="skin-diagnosis-card">
        <h2>내 진단 목록</h2>
        {!checkingMember && !memberId ? (
          <p>로그인하면 분석 결과가 자동 저장되고 이 목록에서 확인할 수 있습니다.</p>
        ) : null}
        {myList.length === 0 ? (
          <p>저장된 진단이 없습니다.</p>
        ) : (
          <div className="skin-diagnosis-list">
            {myList.map((d) => (
              <div key={d.diagnosisId} className="skin-diagnosis-item">
                <strong>{formatDateTime(d.createdAt)}</strong>
                <span>{d.overallComment || d.mainConcern || "분석 결과"}</span>
                <span>{d.mainConcern || "AI 분석 결과"}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );

  if (embedded) return content;

  return (
    <div className="skin-diagnosis-page">
      <header className="skin-diagnosis-header">
        <h1>피부진단</h1>
      </header>
      {content}
    </div>
  );
}
