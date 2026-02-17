import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { AttendMeBackendClient } from '../backend/AttendMeBackendClient'
import type { User } from '../backend/AttendMeBackendClientBase'

type AppRole = 'teacher' | 'student' | null

const backend = new AttendMeBackendClient(
  import.meta.env.VITE_API_URL ?? 'https://attendme-backend.runasp.net',
)

function resolveRole(user: User | null): AppRole {
  if (!user) return null
  if (user.isTeacher) return 'teacher'
  if (user.isStudent) return 'student'
  return null
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const isAuthInitialized = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!backend.userTokenResult?.token)
  const role = computed<AppRole>(() => resolveRole(user.value))

  async function initializeAuth() {
    if (isAuthInitialized.value) return

    isLoading.value = true
    error.value = null
    try {
      backend.restoreTokens()

      if (backend.userTokenResult?.token) {
        user.value = await backend.userGet(undefined)
      }
    } catch (e: any) {
      logout()
      error.value = e?.detail ?? e?.message ?? 'Could not restore session'
    } finally {
      isLoading.value = false
      isAuthInitialized.value = true
    }
  }

  async function login(loginName: string, password: string) {
    isLoading.value = true
    error.value = null
    try {
      await backend.userLogin(loginName, password)
      user.value = await backend.userGet(undefined)
    } catch (e: any) {
      error.value = e?.detail ?? e?.message ?? 'Login failed'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    backend.userTokenResult = undefined
    sessionStorage.removeItem('attend-me:userAuthData')
    user.value = null
  }

  return {
    backend,
    user,
    role,
    error,
    isLoading,
    isAuthInitialized,
    isAuthenticated,
    initializeAuth,
    login,
    logout,
  }
})
