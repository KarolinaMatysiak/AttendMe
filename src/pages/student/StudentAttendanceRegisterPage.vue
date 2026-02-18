<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import QrcodeVue from 'qrcode.vue'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const qrValue = ref('')
const msg = ref('')
let intervalId: number | undefined

async function refreshTicket() {
  try {
    const res = await auth.backend.userAttendanceTicketGet()
    qrValue.value = res.token ?? ''
    msg.value = 'Pokaż ten kod prowadzącemu.'
  } catch (e: any) {
    msg.value = e?.detail ?? e?.message ?? 'Nie udało się pobrać ticketu.'
  }
}

onMounted(() => {
  refreshTicket()
  intervalId = window.setInterval(refreshTicket, 2000)
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

<template>
  <section>
    <h1>Rejestrowanie obecności</h1>
    <QrcodeVue :value="qrValue || 'no-token'" :size="280" level="M" />
    <p>{{ msg }}</p>
  </section>
</template>
