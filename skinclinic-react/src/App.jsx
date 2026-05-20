import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AlertModalProvider } from './components/AlertModalProvider'
import Header from './components/Header'
import MainPage from './pages/MainPage'
import SkinSurveyPage from './pages/skin-survey/SkinSurveyPage'
import SkinSurveyResultPage from './pages/skin-survey/SkinSurveryResultPage'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import FindIdPage from './pages/auth/FindIdPage'
import FindPasswordPage from './pages/auth/FindPasswordPage'
import MyPageEditPage from './pages/mypage/MyPageEditPage'
import MyPagePasswordPage from './pages/mypage/MyPagePasswordPage'
import ProtectedRoute from './components/ProtectedRoute'
import MyPageLayout from './pages/mypage/MyPageLayout'
import SkinDashboard from './pages/mypage/SkinDashboard'
import NotificationPage from './pages/mypage/NotificationPage'
import RecommendationPage from './pages/mypage/RecommendationPage'
import MyPageVerifyPasswordPage from './pages/mypage/MyPageVerifyPasswordPage'
import MyPagePaymentsPage from './pages/mypage/MyPagePaymentsPage'
import ProcedureListPage from './pages/procedure/ProcedureListPage'
import ProcedureDetailPage from './pages/procedure/ProcedureDetailPage'
import TestPaymentPage from './pages/payment/TestPaymentPage'
import PaymentSuccessPage from './pages/payment/PaymentSuccessPage'
import KakaoPaymentApprovePage from './pages/payment/KakaoPaymentApprovePage'
import KakaoPaymentResultPage from './pages/payment/KakaoPaymentResultPage'
import PortOnePaymentRedirectPage from './pages/payment/PortOnePaymentRedirectPage'
import RecommendationResultPage from './pages/recommendation/RecommendationResultPage'
import AdminProcedureListPage from './pages/admin/AdminProcedureListPage'
import AdminProcedureCreatePage from './pages/admin/AdminProcedureCreatePage'
import AdminLayout from './pages/admin/AdminLayout'
import AdminMainPage from './pages/admin/AdminMainPage'
import AdminProcedureEditPage from './pages/admin/AdminProcedureEditPage'
import AdminMemberListPage from './pages/admin/AdminMemberListPage'
import AdminMemberDetailPage from './pages/admin/AdminMemberDetailPage'
import AdminRoute from './components/AdminRoute'
import MyPageWithdrawPage from './pages/mypage/MyPageWithdrawPage'
import ProcedureRecordPage from './pages/mypage/ProcedureRecordPage'
import ProcedureRecordPageFull from './pages/mypage/ProcedureRecordPageFull'
import AdminTreatmentRecordCreatePage from './pages/admin/AdminTreatmentRecordCreatePage'
import AdminTreatmentRecordManagePage from './pages/admin/AdminTreatmentRecordManagePage'
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage'
import AdminPaymentDetailPage from './pages/admin/AdminPaymentDetailPage'
import AdminTreatmentRecordDetailPage from './pages/admin/AdminTreatmentRecordDetailPage'
import UserConsultationChatPage from './pages/chat/UserConsultationChatPage'
import AdminChatPage from './pages/admin/AdminChatPage'
import AdminNotificationPage from './pages/admin/AdminNotificationPage'
import AdminProcedureSatisfactionPage from './pages/admin/AdminProcedureSatisfactionPage'
import ReservePage from './pages/ReservePage'
import AdminReservationsPage from './pages/admin/AdminReservationsPage'
import AdminSkinDiagnosisPage from './pages/admin/AdminSkinDiagnosisPage'
import SkinDiagnosis3DPageFromSim from './pages/skin-diagnosis/SkinDiagnosis3DPage'
import { API_BASE_URL } from '@/config/api'




function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)

  const refreshAuth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setIsLoggedIn(data.authenticated === true)
        setRole(data.role || '')
      } else {
        setIsLoggedIn(false)
        setRole('')
      }
    } catch (error) {
      console.error('Login status check failed:', error)
      setIsLoggedIn(false)
      setRole('')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshAuth()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <AlertModalProvider>
      <BrowserRouter>
        <Header
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={setIsLoggedIn}
          role={role}
          setRole={setRole}
        />
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/skin-survey" element={<SkinSurveyPage />} />
          <Route
            path="/skin-diagnosis"
            element={<SkinDiagnosis3DPageFromSim />}
          />
          <Route
            path="/skin-diagnosis/result"
            element={<Navigate to="/skin-diagnosis" replace />}
          />
          <Route
            path="/result/:id"
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <SkinSurveyResultPage />
              </ProtectedRoute>
            }
          />
          <Route path="/recommendations/:recommendationId" element={<RecommendationResultPage />} />
          <Route
            path="/login"
            element={
              <LoginPage
                setIsLoggedIn={setIsLoggedIn}
                setRole={setRole}
                refreshAuth={refreshAuth}
              />
            }
          />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/find-id" element={<FindIdPage />} />
          <Route path="/find-password" element={<FindPasswordPage />} />
          <Route path="/procedures" element={<ProcedureListPage />} />
          <Route path="/procedures/:procedureId" element={<ProcedureDetailPage />} />
          <Route
            path="/payments/test/:procedureId"
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <TestPaymentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments/success/:paymentId"
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <PaymentSuccessPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments/kakao/success"
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <KakaoPaymentApprovePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments/kakao/cancel"
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <KakaoPaymentResultPage type="cancel" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments/kakao/fail"
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <KakaoPaymentResultPage type="fail" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments/portone/redirect"
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <PortOnePaymentRedirectPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reservations"
            element={<ReservePage />}
          />
          <Route
            path="/consultations"
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <UserConsultationChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/"
            element={
              <AdminRoute isLoggedIn={isLoggedIn} role={role}>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminMainPage />} />
            <Route path="procedures" element={<AdminProcedureListPage />} />
            <Route path="procedures/new" element={<AdminProcedureCreatePage />} />
            <Route path="procedures/:procedureId/edit" element={<AdminProcedureEditPage />} />
            <Route path="members" element={<AdminMemberListPage />} />
            <Route path="members/:memberId" element={<AdminMemberDetailPage />} />
            <Route path="members/:memberId/treatment-records/:treatmentRecordId" element={<AdminTreatmentRecordDetailPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route path="payments/:paymentId" element={<AdminPaymentDetailPage />} />
            <Route path="treatment-records" element={<AdminTreatmentRecordManagePage />} />
            <Route path="treatment-records/new" element={<AdminTreatmentRecordCreatePage />} />
            <Route path="consultations" element={<AdminChatPage />} />
            <Route path="notifications" element={<AdminNotificationPage />} />
            <Route path="procedure-satisfaction" element={<AdminProcedureSatisfactionPage />} />
            <Route path="reservations" element={<AdminReservationsPage />} />
            <Route path="skin-diagnoses" element={<AdminSkinDiagnosisPage />} />

          </Route>
          <Route
            path="/mypage"
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <MyPageLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SkinDashboard />} />
            <Route path="recommendation" element={<RecommendationPage />} />
            <Route path="notifications" element={<NotificationPage />} />
            <Route path="payments" element={<MyPagePaymentsPage />} />
            <Route path="consultations" element={<UserConsultationChatPage />} />
            <Route path="verify-password" element={<MyPageVerifyPasswordPage />} />
            <Route path="edit" element={<MyPageEditPage />} />
            <Route path="password" element={<MyPagePasswordPage />} />
            <Route path="withdraw" element={<MyPageWithdrawPage refreshAuth={refreshAuth} />} />
            <Route path="records" element={<ProcedureRecordPage />} />
            <Route path="reviews" element={<ProcedureRecordPageFull />} />
            <Route path="treatments" element={<ProcedureRecordPage />} />

          </Route>
        </Routes>
      </BrowserRouter>
    </AlertModalProvider>
  )
}

export default App
