<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { QrcodeStream } from 'vue-qrcode-reader'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const sessionId = computed(() => Number(route.params.sessionId))
const scannerToken = computed(() => String(route.query.scannerToken ?? ''))
const msg = ref('')

onMounted(() => {
  if (scannerToken.value) {
    auth.backend.deviceTokenResult = { token: scannerToken.value }
  }
})

async function onDetect(codes: any[]) {
  const attenderToken = codes?.[0]?.rawValue
  if (!attenderToken) return
  try {
    const user = await auth.backend.courseSessionAttendanceRegister(attenderToken)
    msg.value = `Zarejestrowano: ${[user?.name, user?.surname].filter(Boolean).join(' ')}`
  } catch (e: any) {
    msg.value = e?.detail ?? e?.message ?? 'Błąd rejestracji'
  }
}
</script>

<template>
  <section>
    <h1>Skaner obecności</h1>
    <p>Session: {{ sessionId }}</p>
    <QrcodeStream @detect="onDetect" />
    <p>{{ msg }}</p>
  </section>
</template>
