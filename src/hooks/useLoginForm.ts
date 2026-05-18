// Custom hook for login form logic
import { useState } from 'react'

export interface LoginFormState {
  email: string
  password: string
  rememberMe: boolean
  showPassword: boolean
  loading: boolean
}

export interface LoginFormActions {
  setEmail: (email: string) => void
  setPassword: (password: string) => void
  setRememberMe: (remember: boolean) => void
  toggleShowPassword: () => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export function useLoginForm(): LoginFormState & LoginFormActions {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const toggleShowPassword = () => setShowPassword(!showPassword)
  const reset = () => {
    setEmail('')
    setPassword('')
    setRememberMe(false)
    setShowPassword(false)
    setLoading(false)
  }

  return {
    email,
    password,
    rememberMe,
    showPassword,
    loading,
    setEmail,
    setPassword,
    setRememberMe,
    toggleShowPassword,
    setLoading,
    reset,
  }
}
