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
  const raw = (event.target as HTMLInputElement).value
  if (!raw) {
    albumIdNumber.value = null
    return
  }

  const n = Number(raw)
  albumIdNumber.value = Number.isFinite(n) && n > 0 ? Math.floor(n) : null
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.push('/auth/login')
}

function validateForm() {
  if (!deviceName.value.trim()) {
    error.value = 'Pole "Nazwa urządzenia" jest wymagane.'
    return false
  }

  if (!studentName.value.trim()) {
    error.value = 'Pole "Imię" jest wymagane.'
    return false
  }

  if (!studentSurname.value.trim()) {
    error.value = 'Pole "Nazwisko" jest wymagane.'
    return false
  }

  if (albumIdNumber.value === null || albumIdNumber.value <= 0) {
    error.value = 'Pole "Nr albumu" jest wymagane.'
    return false
  }

  return true
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
  
  if (!validateForm()) {
  return
  }

  try {
    await auth.backend.userDeviceRegisterWithToken(token, {
      deviceName: deviceName.value || undefined,
      studentName: studentName.value || undefined,
      studentSurname: studentSurname.value || undefined,
      albumIdNumber: albumIdNumber.value ?? undefined,
    })

    success.value = 'Urządzenie zostało zarejestrowane poprawnie.'
  } catch (e: any) {
    console.log(JSON.parse(JSON.stringify(e, null, 2)))
    const errorType = e?.type ?? JSON.parse(e?.response ?? '{}').type ?? '';

    if (errorType === 'device_user_data_mismatch') {
      error.value = 'Błędne dane studenta.'
    } else if (errorType === 'device_already_registered') {
      error.value = 'Urządzenie jest już zarejestrowane. Przed zarejestrowaniem nowego urządzenia, nauczyciel musi zresetować stare urządzenie.'
    } else {
      error.value = 'Nie udało się zarejestrować urządzenia.'
    }
  } finally {
    isLoading.value = false
  }
}

</script>

<template>
  <section class="device-register">
    <h1>Rejestracja urządzenia</h1>

    <label>
      Nazwa urządzenia
      <input v-model="deviceName" type="text" />
    </label>

    <label>
      Imię
      <input
        v-model="studentName"
        type="text"
        @input="studentName = studentName ? studentName.charAt(0).toUpperCase() + studentName.slice(1).toLowerCase() : ''"
      />
    </label>

    <label>
      Pierwsza litera nazwiska
      <input
        v-model="studentSurname"
        type="text"
        maxlength="1"
        @input="studentSurname = studentSurname ? studentSurname.toUpperCase() : ''"
      />
    </label>

    <label>
      Nr albumu
      <input
        :value="albumIdNumber ?? ''"
        type="number"
        min="1"
        step="1"
        @input="onAlbumInput"
      />
    </label>

   <button
  :disabled="
    isLoading ||
    !deviceName.trim() ||
    !studentName.trim() ||
    !studentSurname.trim() ||
    albumIdNumber === null
  "
  @click="submit"
>
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

.back-btn {
  justify-self: start;
}

label {
  display: grid;
  gap: 6px;
}

input {
  height: 38px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0 10px;
}

button {
  height: 40px;
  border: 0;
  border-radius: 8px;
  background: #2563eb;
  color: #fff;
  cursor: pointer;
}

.ok {
  color: #0f766e;
}

.err {
  color: #b91c1c;
}
</style>
