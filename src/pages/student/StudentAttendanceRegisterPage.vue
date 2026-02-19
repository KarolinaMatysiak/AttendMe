<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import QrcodeVue from 'qrcode.vue'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const qrToken = ref('')
const isLoading = ref(false)
const infoMessage = ref('Przygotowanie kodu QR...')
const error = ref<string | null>(null)

let refreshTimer: number | undefined

async function refreshTicket() {
  isLoading.value = true
  error.value = null

  try {
    const result = await auth.backend.userAttendanceTicketGet()
    qrToken.value = result.token ?? ''

    if (!qrToken.value) {
      infoMessage.value = 'Brak aktywnego ticketu.'
      return
    }

    infoMessage.value = 'Zbliż telefon z kodem QR do kamery urządzenia wykładowcy.'
  } catch (e: any) {
    error.value = e?.detail ?? e?.message ?? 'Nie udało się pobrać ticketu obecności.'
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }

  router.push({ name: 'student-dashboard' })
}

onMounted(() => {
  refreshTicket()
  refreshTimer = window.setInterval(refreshTicket, 2000)
})

onUnmounted(() => {
  if (refreshTimer) window.clearInterval(refreshTimer)
})
</script>

<template>
  <section class="student-attendance-register">
    <button class="btn-secondary back-btn" @click="goBack">Wróć</button>
    <h1>Rejestrowanie obecności</h1>

    <div class="qr-card">
      <QrcodeVue
        :value="qrToken || 'no-ticket'"
        :size="280"
        level="M"
        render-as="svg"
      />

      <p class="info">{{ infoMessage }}</p>
      <p v-if="isLoading" class="muted">Odświeżanie ticketu...</p>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </section>
</template>

<style scoped>
.student-attendance-register {
  max-width: 900px;
  margin: 18px auto 28px;
  padding: 0 16px;
}

.back-btn {
  margin-bottom: 10px;
}

h1 {
  margin: 0 0 14px;
  font-size: 32px;
  color: #1f2937;
}

.qr-card {
  background: #fff;
  border: 1px solid #dbe2ea;
  border-radius: 12px;
  padding: 18px;
  display: grid;
  justify-items: center;
  gap: 10px;
}

.info {
  margin: 0;
  text-align: center;
  color: #374151;
  max-width: 520px;
}

.muted {
  margin: 0;
  color: #6b7280;
}

.error {
  margin: 0;
  color: #b91c1c;
}

.btn-secondary {
  height: 38px;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 14px;
  padding: 0 12px;
  background: #6b7280;
  color: #fff;
}
</style>

