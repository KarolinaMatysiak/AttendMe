<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const loginName = ref('')
const password = ref('')

const isSubmitDisabled = computed(() => {
  return auth.isLoading || !loginName.value.trim() || !password.value.trim()
})

function targetByRole(role: 'teacher' | 'student' | null) {
  if (role === 'teacher') return { name: 'teacher-dashboard' }
  if (role === 'student') return { name: 'student-dashboard' }
  return { name: 'login-page' }
}

async function onSubmit() {
  try {
    auth.error = null

    await auth.login(loginName.value.trim(), password.value)

    console.log('auth.user:', auth.user)
    console.log('auth.role:', auth.role)
    console.log('auth.isAuthenticated:', auth.isAuthenticated)
    console.log('token exists:', !!auth.backend.userTokenResult?.token)

    const redirect = route.query.redirect
    if (typeof redirect === 'string' && redirect.length > 0) {
      await router.push(redirect)
      return
    }

    // tymczasowo na etap dnia 2
    await router.push({ name: 'teacher-dashboard' })
  } catch (e: any) {
    console.error('LOGIN ERROR:', e)
    console.error('LOGIN ERROR DETAIL:', e?.detail)
    console.error('STORE ERROR:', auth.error)
  }
}

</script>

<template>
  <form class="login-form" @submit.prevent="onSubmit">
    <label class="field">
      <span>Login</span>
      <input
        v-model="loginName"
        type="text"
        autocomplete="username"
        placeholder="np. pk albo stu12345"
      />
    </label>

    <label class="field">
      <span>Hasło</span>
      <input
        v-model="password"
        type="password"
        autocomplete="current-password"
        placeholder="Wpisz hasło"
      />
    </label>

    <button type="submit" :disabled="isSubmitDisabled">
      {{ auth.isLoading ? 'Logowanie...' : 'Zaloguj' }}
    </button>

    <p v-if="auth.error" class="error-text">{{ auth.error }}</p>
  </form>
</template>

<style scoped>
.login-form {
  display: grid;
  gap: 12px;
}

.field {
  display: grid;
  gap: 6px;
}

.field span {
  font-size: 0.95rem;
  color: #374151;
}

input {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 1rem;
}

button {
  margin-top: 4px;
  border: 0;
  border-radius: 8px;
  padding: 10px 12px;
  background: #111827;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-text {
  margin: 2px 0 0;
  color: #b91c1c;
}
</style>
