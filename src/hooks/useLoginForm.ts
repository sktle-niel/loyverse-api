import { useState } from 'react'

export interface LoginFormState {
  login: string
  password: string
  showPassword: boolean
  loading: boolean
}

export interface LoginFormActions {
  setLogin: (login: string) => void
  setPassword: (password: string) => void
  toggleShowPassword: () => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export function useLoginForm(): LoginFormState & LoginFormActions {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const toggleShowPassword = () => setShowPassword(!showPassword)
  const reset = () => {
    setLogin('')
    setPassword('')
    setShowPassword(false)
    setLoading(false)
  }

  return {
    login,
    password,
    showPassword,
    loading,
    setLogin,
    setPassword,
    toggleShowPassword,
    setLoading,
    reset,
  }
}
