import { AppGate } from './components/AppGate'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ToastLayer } from './components/ToastLayer'

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppGate />
        <ToastLayer />
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
