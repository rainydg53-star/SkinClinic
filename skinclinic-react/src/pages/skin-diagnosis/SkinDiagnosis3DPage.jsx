import { Suspense, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF } from "@react-three/drei";
import { getMyMemberInfo } from "@/api/memberApi";
import { analyzeSkinPhoto, createSkinDiagnosis } from "@/api/skinDiagnosisApi";
import SkinDiagnosisPage from "./SkinDiagnosisPage";
import "./SkinDiagnosisPage.css";
import { API_BASE_URL } from '@/config/api'

const REGION_MARKER_MAP = {
  FOREHEAD: [{ position: [0, 0.88, 0.65], scale: 0.13, label: "이마" }],
  NOSE: [{ position: [0, 0.4, 0.98], scale: 0.1, label: "코" }],
  LEFT_CHEEK: [{ position: [-0.48, 0.22, 0.78], scale: 0.13, label: "왼쪽 볼" }],
  RIGHT_CHEEK: [{ position: [0.48, 0.22, 0.78], scale: 0.13, label: "오른쪽 볼" }],
  CHEEK: [
    { position: [-0.48, 0.22, 0.78], scale: 0.13, label: "왼쪽 볼" },
    { position: [0.48, 0.22, 0.78], scale: 0.13, label: "오른쪽 볼" },
  ],
  CHIN: [{ position: [0, -0.15, 0.84], scale: 0.12, label: "턱" }],
};

const TROUBLE_REGION_LABELS = {
  LEFT_CHEEK: "왼쪽 뺨",
  RIGHT_CHEEK: "오른쪽 뺨",
  FOREHEAD: "이마",
  NOSE: "코",
  CHIN: "턱",
};

function FaceModel({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={1} position={[0, 0, 0]} rotation={[0, Math.PI, 0]} />;
}

function TroubleMarkers({ regions }) {
  const markers = regions.flatMap((region) => REGION_MARKER_MAP[region] ?? []);
  return (
    <>
      {markers.map((marker, idx) => (
        <mesh key={`${marker.label}-${idx}`} position={marker.position}>
          <sphereGeometry args={[marker.scale, 24, 24]} />
          <meshStandardMaterial
            color="#ff2d2d"
            emissive="#cc1a1a"
            emissiveIntensity={0.95}
            opacity={0.5}
            transparent
          />
        </mesh>
      ))}
    </>
  );
}

function Face3DViewer({ troubleRegions }) {
  const az = (45 * Math.PI) / 180;
  const [modelOk, setModelOk] = useState(true);
  const modelUrl = "/model.glb";

  useEffect(() => {
    let cancelled = false;
    fetch(modelUrl, { method: "GET" })
      .then((res) => {
        if (cancelled) return;
        setModelOk(res.ok);
      })
      .catch(() => {
        if (cancelled) return;
        setModelOk(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="diagnosis-frame">
      <div className="diagnosis-frame__header">
        <div className="diagnosis-frame__title">3D 얼굴</div>
        <div className="diagnosis-frame__hint">좌우 회전만 가능 (±45도)</div>
      </div>
      <div className="diagnosis-frame__body">
        {!modelOk ? (
          <div className="diagnosis-empty">3D 모델을 찾을 수 없습니다. `public/model.glb` 파일을 확인해주세요.</div>
        ) : (
          <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <Stage environment="city" intensity={0.5}>
              <Suspense fallback={null}>
                <FaceModel url={modelUrl} />
                <TroubleMarkers regions={troubleRegions} />
              </Suspense>
            </Stage>
            <OrbitControls
              makeDefault
              enablePan={false}
              enableZoom={false}
              minPolarAngle={Math.PI / 2}
              maxPolarAngle={Math.PI / 2}
              minAzimuthAngle={-az}
              maxAzimuthAngle={az}
            />
          </Canvas>
        )}
      </div>
    </div>
  );
}

function ImageZoomFrame({ imageUrl, offset, setOffset }) {
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  const onMouseDown = (e) => {
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
  };

  const stopDrag = () => {
    dragging.current = false;
  };

  return (
    <div className="diagnosis-frame">
      <div className="diagnosis-frame__header">
        <div className="diagnosis-frame__title">업로드한 사진</div>
        <div className="diagnosis-frame__hint">드래그로 이동</div>
      </div>
      <div
        className="diagnosis-frame__body diagnosis-image-body"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="업로드 사진"
            className="diagnosis-image"
            style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(1)` }}
            draggable={false}
          />
        ) : (
          <div className="diagnosis-empty">사진을 업로드해 주세요.</div>
        )}
      </div>
    </div>
  );
}

export default function SkinDiagnosis3DPage({ embedded = false }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [imageUrl, setImageUrl] = useState("");
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [troubleRegions, setTroubleRegions] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState("");
  const [diagnosisListRefreshToken, setDiagnosisListRefreshToken] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const LOGIN_REDIRECT_PATH = "/skin-diagnosis";

  const checkAuthenticated = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        credentials: "include",
      });
      if (!response.ok) return false;
      const auth = await response.json();
      return auth.authenticated === true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const loadAuth = async () => {
      const auth = await checkAuthenticated();
      setIsAuthenticated(auth);
    };
    loadAuth();
  }, []);

  const moveToLogin = () => {
    navigate(`/login?redirect=${encodeURIComponent(LOGIN_REDIRECT_PATH)}`);
  };

  const handleFileInputClick = (event) => {
    if (isAuthenticated) return;
    event.preventDefault();
    moveToLogin();
  };

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const onFileChange = async (e) => {
    const auth = await checkAuthenticated();
    setIsAuthenticated(auth);
    if (!auth) {
      moveToLogin();
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setOffset({ x: 0, y: 0 });
    setTroubleRegions([]);
    setAnalysisMessage("");
    setStep(2);

    try {
      setAnalyzing(true);
      const result = await analyzeSkinPhoto(file);
      const troubles = Array.from(
        new Set(
          (result?.regions || [])
        .filter((region) => region?.trouble)
            .map((region) => String(region.region || "").toUpperCase()),
        ),
      );
      setTroubleRegions(troubles);
      const computedMessage =
        result?.message || "업로드한 사진 분석이 완료되었습니다.";

      setAnalysisMessage(computedMessage);

      // AI 쿼터 초과 등 fallback 응답일 때는 자동 저장을 건너뜁니다.
      if (result?.success !== true || result?.fallbackUsed === true) {
        return;
      }

      try {
        const me = await getMyMemberInfo();
        const autoSavePayload = {
          memberId: me.id,
          source: "PHOTO_AI",
          skinTypeResult: null,
          mainConcern:
            troubles.length > 0
              ? `${troubles
                  .map((region) => TROUBLE_REGION_LABELS[region] || region)
                  .join(", ")} 부위 트러블 의심`
              : "특이 트러블 부위 없음",
          overallComment: computedMessage,
          regions: troubles.map((region) => ({
            region,
            conditionText: "AI 분석에서 트러블 징후가 감지됨",
          })),
        };
        await createSkinDiagnosis(autoSavePayload);
        setDiagnosisListRefreshToken((prev) => prev + 1);
      } catch {
        setAnalysisMessage(
          `${computedMessage} (로그인 후 분석 결과가 자동 저장되어 내 진단 목록에 표시됩니다.)`,
        );
      }
    } catch (error) {
      setAnalysisMessage(error?.message || "사진 분석 중 문제가 발생했습니다.");
    } finally {
      setAnalyzing(false);
    }
  };

  const troubleRegionText = Array.from(new Set(troubleRegions))
    .map((region) => TROUBLE_REGION_LABELS[region] || region)
    .join(", ");

  const content = (
    <>
      {step === 1 ? (
        <section className="skin-diagnosis-card">
          <h2>3D 얼굴 진단</h2>
          <p className="diagnosis-subtitle">사진 업로드 후 문제 부위를 분석해 3D 얼굴에 빨간색으로 표시합니다.</p>
          <label className="diagnosis-file-field">
            <span>얼굴 사진 업로드</span>
            <input type="file" accept="image/*" onClick={handleFileInputClick} onChange={onFileChange} />
          </label>
        </section>
      ) : (
        <section className="skin-diagnosis-card">
          <h2>사진 vs 3D 얼굴 비교</h2>
          <p className="diagnosis-subtitle">문제 부위가 있으면 3D 얼굴에서 빨간색 오버레이로 표시됩니다.</p>

          <div className="diagnosis-compare">
            <ImageZoomFrame
              imageUrl={imageUrl}
              offset={offset}
              setOffset={setOffset}
            />
            <Face3DViewer troubleRegions={troubleRegions} />
          </div>

          <div className="diagnosis-actions">
            <button type="button" className="secondary" onClick={() => setStep(1)}>사진 다시 업로드</button>
          </div>
          <div className="diagnosis-result-feedback">
            {analyzing ? <p className="diagnosis-subtitle">사진을 분석하는 중입니다...</p> : null}
            {!analyzing && analysisMessage ? <p className="diagnosis-subtitle">{analysisMessage}</p> : null}
            {!analyzing ? (
              troubleRegions.length > 0 ? (
                <p className="diagnosis-subtitle">표시 부위: {troubleRegionText}</p>
              ) : (
                <p className="diagnosis-subtitle">현재 표시된 문제 부위가 없습니다.</p>
              )
            ) : null}
          </div>
          <SkinDiagnosisPage embedded autoRefreshToken={diagnosisListRefreshToken} />
        </section>
      )}
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
