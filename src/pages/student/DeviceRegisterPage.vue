<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const deviceName = ref('')
const studentName = ref('')
const studentSurname = ref('')
const albumIdNumber = ref<number | null>(null)

const isLoading = ref(false)
const error = ref('')
const success = ref('')

function onAlbumInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  albumIdNumber.value = value ? Number(value) : null
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.push('/auth/login')
}

async function submit() {
  const token = String(route.params.token ?? '')
  if (!token) {
    error.value = 'Brak tokenu rejestracyjnego w linku.'
    return
  }

  isLoading.value = true
  error.value = ''
  success.value = ''

  try {
    await auth.backend.userDeviceRegisterWithToken(token, {
      deviceName: deviceName.value || undefined,
      studentName: studentName.value || undefined,
      studentSurname: studentSurname.value || undefined,
      albumIdNumber: albumIdNumber.value ?? undefined,
    })

    success.value = 'Urządzenie zostało zarejestrowane poprawnie.'
  } catch (e: any) {
    error.value = e?.detail ?? e?.message ?? 'Nie udało się zarejestrować urządzenia.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <section class="device-register">
    <button class="back-btn" @click="goBack">Wróć</button>
    <h1>Rejestracja urządzenia</h1>

    <label>Nazwa urządzenia <input v-model="deviceName" type="text" /></label>
    <label>Imię <input v-model="studentName" type="text" /></label>
    <label>Nazwisko <input v-model="studentSurname" type="text" /></label>
    <label>
      Nr albumu
      <input :value="albumIdNumber ?? ''" type="number" @input="onAlbumInput" />
    </label>

    <button :disabled="isLoading" @click="submit">
      {{ isLoading ? 'Rejestrowanie...' : 'Zarejestruj urządzenie' }}
    </button>

    <p v-if="success" class="ok">{{ success }}</p>
    <p v-if="error" class="err">{{ error }}</p>
  </section>
</template>

<style scoped>
.device-register {
  max-width: 420px;
  margin: 36px auto;
  display: grid;
  gap: 10px;
  padding: 0 16px;
}
.back-btn { justify-self: start; }
label { display: grid; gap: 6px; }
input { height: 38px; border: 1px solid #d1d5db; border-radius: 8px; padding: 0 10px; }
button { height: 40px; border: 0; border-radius: 8px; background: #2563eb; color: #fff; cursor: pointer; }
.ok { color: #0f766e; }
.err { color: #b91c1c; }
</style>
