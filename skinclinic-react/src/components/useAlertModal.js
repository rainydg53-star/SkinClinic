import { createContext, useContext } from 'react'

const AlertModalContext = createContext(null)

function useAlertModal() {
  const context = useContext(AlertModalContext)

  if (!context) {
    throw new Error('useAlertModal must be used within AlertModalProvider')
  }

  return context
}

export { AlertModalContext, useAlertModal }
