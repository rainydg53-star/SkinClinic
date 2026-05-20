import { useMemo, useState } from 'react'
import { AlertModalContext } from './useAlertModal'
import './AlertModalProvider.css'

const initialModalState = {
  open: false,
  type: 'alert',
  title: '',
  message: '',
  confirmText: '확인',
  cancelText: '취소',
  onConfirm: null,
  onCancel: null,
}

function AlertModalProvider({ children }) {
  const [modalState, setModalState] = useState(initialModalState)

  const resetModal = () => {
    setModalState(initialModalState)
  }

  const showAlert = ({ title = '안내', message, confirmText = '확인', onConfirm = null }) => {
    setModalState({
      open: true,
      type: 'alert',
      title,
      message,
      confirmText,
      cancelText: '취소',
      onConfirm,
      onCancel: null,
    })
  }

  const showConfirm = ({
    title = '확인',
    message,
    confirmText = '확인',
    cancelText = '취소',
    onConfirm = null,
    onCancel = null,
  }) => {
    setModalState({
      open: true,
      type: 'confirm',
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
      onCancel,
    })
  }

  const handleConfirm = () => {
    const confirmAction = modalState.onConfirm
    resetModal()

    if (typeof confirmAction === 'function') {
      confirmAction()
    }
  }

  const handleCancel = () => {
    const cancelAction = modalState.onCancel
    resetModal()

    if (typeof cancelAction === 'function') {
      cancelAction()
    }
  }

  const value = useMemo(() => ({ showAlert, showConfirm }), [])

  return (
    <AlertModalContext.Provider value={value}>
      {children}
      {modalState.open && (
        <div className="alert-modal-overlay" role="dialog" aria-modal="true">
          <div className="alert-modal">
            <div className="alert-modal-badge">
              {modalState.type === 'confirm' ? 'Confirm' : 'Notice'}
            </div>
            <h3 className="alert-modal-title">{modalState.title}</h3>
            <p className="alert-modal-message">{modalState.message}</p>

            <div className={`alert-modal-actions ${modalState.type === 'confirm' ? 'is-confirm' : ''}`}>
              {modalState.type === 'confirm' && (
                <button
                  type="button"
                  className="alert-modal-button alert-modal-button-secondary"
                  onClick={handleCancel}
                >
                  {modalState.cancelText}
                </button>
              )}

              <button
                type="button"
                className="alert-modal-button"
                onClick={handleConfirm}
              >
                {modalState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertModalContext.Provider>
  )
}

export { AlertModalProvider }
