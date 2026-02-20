<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import QrcodeVue from 'qrcode.vue'
import { useAuthStore } from '../../stores/auth'
import type { CourseSessionAttendanceRecord, CourseSessionListItem } from '../../backend/AttendMeBackendClientBase'

type DeviceModalRow = {
  userId: number
  fullName: string
  album: string
  deviceName: string
}

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const sessionId = computed(() => Number(route.params.sessionId))

const isLoading = ref(false)
const isToggling = ref(false)
const error = ref<string | null>(null)
const sessionData = ref<CourseSessionListItem | null>(null)
const attendanceRows = ref<CourseSessionAttendanceRecord[]>([])

const isScannerModalOpen = ref(false)
const scannerLink = ref('')
const scannerToken = ref('')

const isDeviceModalOpen = ref(false)
const isDeviceLoading = ref(false)
const deviceRows = ref<DeviceModalRow[]>([])
let attendanceRefreshTimer: number | undefined

const dateFormatter = new Intl.DateTimeFormat('pl-PL', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('pl-PL', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

function formatDate(value?: Date) {
  if (!value) return '-'
  return dateFormatter.format(new Date(value))
}

function formatTimeRange(start?: Date, end?: Date) {
  if (!start || !end) return '-'
  return `${timeFormatter.format(new Date(start))} - ${timeFormatter.format(new Date(end))}`
}

async function loadData() {
  isLoading.value = true
  error.value = null

  try {
    const [session, attendance] = await Promise.all([
      auth.backend.courseTeacherSessionGet(sessionId.value),
      auth.backend.courseSessionAttendanceListGet(sessionId.value),
    ])

    sessionData.value = session
    attendanceRows.value = attendance ?? []
  } catch (e: any) {
    error.value = e?.detail ?? e?.message ?? 'Nie udało się pobrać danych.'
  } finally {
    isLoading.value = false
  }
}

async function toggleAttendance(row: CourseSessionAttendanceRecord) {
  if (isToggling.value) return
  if (!row.attenderUserId || !row.courseSessionId) return

  isToggling.value = true
  error.value = null

  try {
    const shouldAdd = !row.wasUserPresent
    await auth.backend.courseSessionAttendanceToggle(row.attenderUserId, row.courseSessionId, shouldAdd)
    attendanceRows.value = await auth.backend.courseSessionAttendanceListGet(sessionId.value)
  } catch (e: any) {
    error.value = e?.detail ?? e?.message ?? 'Nie udało się zmienić obecności.'
  } finally {
    isToggling.value = false
  }
}

async function refreshAttendance() {
  error.value = null
  try {
    attendanceRows.value = await auth.backend.courseSessionAttendanceListGet(sessionId.value)
  } catch (e: any) {
    error.value = e?.detail ?? e?.message ?? 'Nie udało się odświeżyć listy obecności.'
  }
}

function goToDashboard() {
  router.push({ name: 'teacher-dashboard' })
}

/* Scanner modal */

async function openScannerModal() {
  error.value = null

  try {
    const result = await auth.backend.courseSessionAttendanceScannerTokenGet(sessionId.value)
    scannerToken.value = result.token ?? ''

    const resolved = router.resolve({
      name: 'teacher-session-scanner',
      params: { sessionId: String(sessionId.value) },
      query: { scannerToken: scannerToken.value },
    })

    scannerLink.value = new URL(resolved.href, window.location.origin).toString()
    isScannerModalOpen.value = true
  } catch (e: any) {
    error.value = e?.detail ?? e?.message ?? 'Nie udało się pobrać tokenu skanera.'
  }
}

function closeScannerModal() {
  isScannerModalOpen.value = false
}

async function copyScannerLink() {
  if (!scannerLink.value) return
  await navigator.clipboard.writeText(scannerLink.value)
}

/* Device registration modal */

async function buildDeviceRows() {
  const ids = Array.from(
    new Set(
      attendanceRows.value
        .map((r) => r.attenderUserId)
        .filter((id): id is number => typeof id === 'number'),
    ),
  )

  const users = await Promise.all(ids.map((id) => auth.backend.userGet(id)))

  return users.map((u) => ({
    userId: u.userId!,
    fullName: `${u.name ?? ''} ${u.surname ?? ''}`.trim() || '-',
    album: String(u.student?.albumIdNumber ?? '-'),
    deviceName: u.deviceName ?? '-',
  }))
}

async function openDeviceModal() {
  isDeviceModalOpen.value = true
  isDeviceLoading.value = true
  error.value = null

  try {
    deviceRows.value = await buildDeviceRows()
  } catch (e: any) {
    error.value = e?.detail ?? e?.message ?? 'Nie udało się pobrać danych urządzeń.'
    deviceRows.value = []
  } finally {
    isDeviceLoading.value = false
  }
}

function closeDeviceModal() {
  isDeviceModalOpen.value = false
}

async function copyRegisterLink(userId: number) {
  try {
    const tokenResult = await auth.backend.userDeviceRegisterTokenGet(userId)
    const token = tokenResult.token ?? ''
    const link = new URL(`/device/register/${encodeURIComponent(token)}`, window.location.origin).toString()
    await navigator.clipboard.writeText(link)
  } catch (e: any) {
    error.value = e?.detail ?? e?.message ?? 'Nie udało się wygenerować linku.'
  }
}

async function resetDevice(userId: number) {
  try {
    await auth.backend.userDeviceReset(userId)
    deviceRows.value = await buildDeviceRows()
  } catch (e: any) {
    error.value = e?.detail ?? e?.message ?? 'Nie udało się zresetować urządzenia.'
  }
}

onMounted(async () => {
  await loadData()
  attendanceRefreshTimer = window.setInterval(() => {
    refreshAttendance()
  }, 5000)
})

onUnmounted(() => {
  if (attendanceRefreshTimer) {
    window.clearInterval(attendanceRefreshTimer)
  }
})
</script>

<template>
  <section class="teacher-details">
    <button class="btn-secondary back-btn" @click="goToDashboard">Wróć</button>
    <p v-if="error" class="error">{{ error }}</p>

    <div class="top-section">
      <div class="session-meta">
        <h1>{{ sessionData?.courseName || '-' }}</h1>
        <p><strong>Grupa</strong> {{ sessionData?.courseGroupName || '-' }}</p>
        <p><strong>Termin</strong> {{ formatDate(sessionData?.dateStart) }}</p>
        <p><strong>Godziny</strong> {{ formatTimeRange(sessionData?.dateStart, sessionData?.dateEnd) }}</p>
        <p><strong>Lokalizacja</strong> {{ sessionData?.locationName || '-' }}</p>
      </div>

      <div class="actions-panel">
        <button class="btn-primary" @click="openScannerModal">Skaner obecności</button>
        <button class="btn-secondary" @click="openDeviceModal">Rejestracja urządzenia</button>
      </div>
    </div>

    <div class="table-actions">
      <button class="btn-secondary" :disabled="isLoading || isToggling" @click="refreshAttendance">
        Odśwież
      </button>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Uczestnik</th>
            <th>Nr albumu</th>
            <th>Obecność</th>
            <th>Akcja</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!isLoading && attendanceRows.length === 0">
            <td colspan="4" class="empty">Brak uczestników dla tych zajęć.</td>
          </tr>

          <tr v-for="row in attendanceRows" :key="`${row.attenderUserId}-${row.courseSessionId}`">
            <td>{{ row.userName }} {{ row.userSurname }}</td>
            <td>{{ row.studentAlbumIdNumber ?? '-' }}</td>
            <td>
              <span :class="row.wasUserPresent ? 'badge-present' : 'badge-absent'">
                {{ row.wasUserPresent ? 'Obecny' : 'Brak' }}
              </span>
            </td>
            <td>
              <button class="btn-action" :disabled="isToggling" @click="toggleAttendance(row)">
                {{ row.wasUserPresent ? 'Odznacz' : 'Zaznacz' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Scanner modal -->
    <div v-if="isScannerModalOpen" class="modal-backdrop">
      <div class="modal">
        <h3>Skaner obecności</h3>
        <p>Zeskanuj ten kod na urządzeniu z kamerą, aby uruchomić ekran skanera.</p>

        <QrcodeVue :value="scannerLink || 'no-link'" :size="260" />

        <div class="modal-actions">
          <button class="btn-secondary" @click="copyScannerLink">Skopiuj adres</button>
          <button class="btn-secondary" @click="closeScannerModal">Zamknij</button>
        </div>
      </div>
    </div>

    <!-- Device registration modal -->
    <div v-if="isDeviceModalOpen" class="modal-backdrop">
      <div class="modal modal-wide">
        <h3>Linki do rejestracji urządzenia</h3>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Uczestnik</th>
                <th>Nr albumu</th>
                <th>Aktualne urządzenie</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isDeviceLoading">
                <td colspan="4" class="empty">Ładowanie...</td>
              </tr>

              <tr v-else-if="deviceRows.length === 0">
                <td colspan="4" class="empty">Brak danych studentów.</td>
              </tr>

              <tr v-for="row in deviceRows" :key="row.userId">
                <td>{{ row.fullName }}</td>
                <td>{{ row.album }}</td>
                <td>{{ row.deviceName }}</td>
                <td class="actions-cell">
                  <button class="btn-danger" @click="resetDevice(row.userId)">Resetuj</button>
                  <button class="btn-primary" @click="copyRegisterLink(row.userId)">Skopiuj link</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="modal-actions">
          <button class="btn-secondary" @click="closeDeviceModal">Zamknij</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.teacher-details {
  max-width: 1180px;
  margin: 18px auto 28px;
  padding: 0 16px;
  display: grid;
  gap: 16px;
}

.back-btn {
  justify-self: start;
}

.top-section {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 20px;
  align-items: start;
  background: #fff;
  border: 1px solid #dbe2ea;
  border-radius: 10px;
  padding: 18px;
}

.session-meta h1 {
  margin: 0 0 10px;
  font-size: 42px;
  font-weight: 700;
  color: #1f2937;
}

.session-meta p {
  margin: 6px 0;
  color: #374151;
  font-size: 25px;
}

.actions-panel {
  display: grid;
  gap: 10px;
}

.table-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  height: 38px;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 14px;
  padding: 0 12px;
}

.btn-primary {
  background: #2f80ed;
  color: #fff;
}

.btn-secondary {
  background: #6b7280;
  color: #fff;
}

.btn-danger {
  background: #dc3545;
  color: #fff;
}

.table-wrap {
  border: 1px solid #dbe2ea;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border-bottom: 1px solid #e5e9ee;
  text-align: left;
  padding: 10px 12px;
  font-size: 16px;
}

thead th {
  background: #f7f8fa;
  font-weight: 700;
  color: #1f2937;
}

.badge-present,
.badge-absent {
  display: inline-block;
  min-width: 62px;
  text-align: center;
  padding: 3px 8px;
  border-radius: 999px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

.badge-present {
  background: #21a366;
}

.badge-absent {
  background: #d64550;
}

.btn-action {
  height: 30px;
  border: 0;
  border-radius: 4px;
  padding: 0 10px;
  background: #1f2937;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}

.btn-action:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.actions-cell {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.empty {
  text-align: center;
  color: #6b7280;
  padding: 16px;
}

.error {
  color: #b91c1c;
  margin: 0;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.45);
  display: grid;
  place-items: center;
  z-index: 1000;
}

.modal {
  width: min(92vw, 420px);
  background: #fff;
  border: 1px solid #dbe2ea;
  border-radius: 10px;
  padding: 14px;
  display: grid;
  gap: 10px;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.18);
  justify-items: center;
  text-align: center;
}

.modal-wide {
  width: min(96vw, 900px);
  justify-items: stretch;
  text-align: left;
}

.modal h3 {
  margin: 0;
}

.modal p {
  margin: 0;
  color: #4b5563;
  max-width: 320px;
}

.modal :deep(canvas),
.modal :deep(svg) {
  display: block;
  margin: 0 auto;
}

.modal-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 8px;
}

@media (max-width: 980px) {
  .top-section {
    grid-template-columns: 1fr;
  }

  .actions-panel {
    grid-template-columns: 1fr 1fr;
  }

  .session-meta h1 {
    font-size: 34px;
  }

  .session-meta p {
    font-size: 20px;
  }
}

.modal-wide {
  width: min(96vw, 900px);
  max-height: 90vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  overflow: hidden;
}

.modal-wide .table-wrap {
  max-height: 58vh;
  overflow: auto;
}

</style>
