import { useState } from "react";
import SkinDiagnosisPage from "./SkinDiagnosisPage";
import SkinDiagnosis3DPage from "./SkinDiagnosis3DPage";
import "./SkinDiagnosisPage.css";

export default function SkinDiagnosisMenu() {
  const [tab, setTab] = useState("text");

  return (
    <div className="skin-diagnosis-page">
      <header className="skin-diagnosis-header">
        <h1>피부진단</h1>
        <div className="skin-diagnosis-tabs">
          <button type="button" className={tab === "text" ? "active" : ""} onClick={() => setTab("text")}>
            텍스트 진단
          </button>
          <button type="button" className={tab === "3d" ? "active" : ""} onClick={() => setTab("3d")}>
            3D 얼굴
          </button>
        </div>
      </header>

      {tab === "text" ? <SkinDiagnosisPage embedded /> : <SkinDiagnosis3DPage embedded />}
    </div>
  );
}
