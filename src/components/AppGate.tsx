import { useAuth } from '../context/AuthContext'
import { MainLayout } from '../layouts/MainLayout'
import { Login } from './Login'

export function AppGate() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center gap-4">
        <span className="loading loading-spinner loading-lg text-primary" />
        <p className="text-base-content/60 text-sm">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login />
  }

  return <MainLayout />
}
