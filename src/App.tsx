import { MainLayout } from './layouts/MainLayout'
import { ToastProvider } from './context/ToastContext'
import { ToastLayer } from './components/ToastLayer'

function App() {
  return (
    <ToastProvider>
      <MainLayout />
      <ToastLayer />
    </ToastProvider>
  )
}

export default App
