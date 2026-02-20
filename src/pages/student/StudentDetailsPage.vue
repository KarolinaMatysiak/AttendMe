<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import type {
  AttendanceLog,
  CourseSessionListItem,
  CourseSessionListItemPagedList,
} from '../../backend/AttendMeBackendClientBase'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const sessionId = computed(() => Number(route.params.sessionId))

const isLoading = ref(false)
const error = ref<string | null>(null)

const currentSession = ref<CourseSessionListItem | null>(null)
const groupSessions = ref<CourseSessionListItem[]>([])
const attendanceLogs = ref<AttendanceLog[]>([])

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

const isCurrentSessionActive = computed(() => {
  if (!currentSession.value?.dateStart || !currentSession.value?.dateEnd) return false
  const now = Date.now()
  const start = new Date(currentSession.value.dateStart).getTime()
  const end = new Date(currentSession.value.dateEnd).getTime()
  return now >= start && now <= end
})

const totalSessionsCount = computed(() => groupSessions.value.length)

const attendedCount = computed(() => {
  const uniqueIds = new Set(
    (attendanceLogs.value ?? [])
      .map((log) => log.courseSessionId)
      .filter((id): id is number => typeof id === 'number'),
  )
  return uniqueIds.size
})

const attendancePercent = computed(() => {
  if (!totalSessionsCount.value) return 0
  return Math.round((attendedCount.value / totalSessionsCount.value) * 100)
})

const progressPercent = computed(() => {
  if (!totalSessionsCount.value || !currentSession.value?.courseSessionId) return 0

  const sorted = [...groupSessions.value].sort((a, b) => {
    const aTime = a.dateStart ? new Date(a.dateStart).getTime() : 0
    const bTime = b.dateStart ? new Date(b.dateStart).getTime() : 0
    return aTime - bTime
  })

  const index = sorted.findIndex((s) => s.courseSessionId === currentSession.value?.courseSessionId)
  if (index < 0) return 0
  return Math.round(((index + 1) / sorted.length) * 100)
})

const isPresentOnCurrentSession = computed(() => {
  const id = currentSession.value?.courseSessionId
  if (!id) return false
  return (attendanceLogs.value ?? []).some((log) => log.courseSessionId === id)
})

async function loadData() {
  if (!Number.isFinite(sessionId.value) || sessionId.value <= 0) {
    error.value = 'Nieprawidłowe ID zajęć.'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const list: CourseSessionListItemPagedList = await auth.backend.courseStudentSessionsGet({
      pageNumber: 1,
      pageSize: 999999,
      filters: {},
    })

    const selected = (list.items ?? []).find((x) => x.courseSessionId === sessionId.value) ?? null
    currentSession.value = selected

    if (!selected?.courseGroupId) {
      groupSessions.value = []
      attendanceLogs.value = []
      return
    }

    const [sessions, logs] = await Promise.all([
      auth.backend.courseStudentGroupSessionsGet(selected.courseGroupId),
      auth.backend.courseStudentAttendanceGet(selected.courseGroupId),
    ])

    groupSessions.value = sessions ?? []
    attendanceLogs.value = logs ?? []
  } catch (e: any) {
    error.value = e?.detail ?? e?.message ?? 'Nie udało się pobrać szczegółów zajęć.'
    currentSession.value = null
    groupSessions.value = []
    attendanceLogs.value = []
  } finally {
    isLoading.value = false
  }
}

function goToRegisterAttendance() {
  router.push({ name: 'student-attendance-register' })
}

function goBack() {
  router.push({ name: 'student-dashboard' })
}

onMounted(loadData)
</script>

<template>
  <section class="student-details">
    <button class="btn-secondary back-btn" @click="goBack">Wróć</button>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-else-if="isLoading" class="muted">Ładowanie...</p>

    <template v-else-if="currentSession">
      <div class="top-row">
        <div class="meta">
          <h1>{{ currentSession.courseName || '-' }}</h1>
          <p><strong>Termin</strong> {{ formatDate(currentSession.dateStart) }}</p>
          <p><strong>Godziny</strong> {{ formatTimeRange(currentSession.dateStart, currentSession.dateEnd) }}</p>
          <p><strong>Lokalizacja</strong> {{ currentSession.locationName || '-' }}</p>

          <button
            v-if="isCurrentSessionActive"
            class="btn-primary register-btn"
            @click="goToRegisterAttendance"
          >
            Rejestruj obecność
          </button>
        </div>

        <div class="status-box">
          <p>Obecność:</p>
          <span :class="isPresentOnCurrentSession ? 'status-present' : 'status-absent'">
            {{ isPresentOnCurrentSession ? 'OBECNY' : 'BRAK' }}
          </span>
        </div>
      </div>

      <div class="progress-block">
        <p class="label">
          Frekwencja dotychczasowa: {{ attendedCount }} z {{ totalSessionsCount }} - {{ attendancePercent }}%
        </p>
        <div class="bar-track">
          <div class="bar-fill attendance" :style="{ width: `${attendancePercent}%` }"></div>
        </div>
      </div>

      <div class="progress-block">
        <p class="label">Zaawansowanie kursu: {{ progressPercent }}%</p>
        <div class="bar-track">
          <div class="bar-fill progress" :style="{ width: `${progressPercent}%` }"></div>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.student-details {
  max-width: 1180px;
  margin: 18px auto 28px;
  padding: 0 16px;
  display: grid;
  gap: 16px;
}

.back-btn {
  justify-self: start;
}

.top-row {
  background: #fff;
  border: 1px solid #dbe2ea;
  border-radius: 10px;
  padding: 18px;
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 16px;
}

.meta h1 {
  margin: 0 0 10px;
  font-size: 42px;
  font-weight: 700;
  color: #1f2937;
}

.meta p {
  margin: 6px 0;
  color: #374151;
  font-size: 25px;
}

.register-btn {
  margin-top: 12px;
}

.status-box {
  align-self: start;
  display: grid;
  gap: 8px;
}

.status-box p {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.status-present,
.status-absent {
  display: inline-block;
  min-width: 180px;
  text-align: center;
  padding: 10px 14px;
  border-radius: 8px;
  color: #fff;
  font-size: 36px;
  font-weight: 800;
}

.status-present {
  background: #1f9d64;
}

.status-absent {
  background: #d64550;
}

.progress-block {
  background: #fff;
  border: 1px solid #dbe2ea;
  border-radius: 10px;
  padding: 14px;
}

.label {
  margin: 0 0 8px;
  font-size: 30px;
  color: #1f2937;
}

.bar-track {
  height: 14px;
  border-radius: 8px;
  background: #e5e9ee;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
}

.bar-fill.attendance {
  background: repeating-linear-gradient(
    -45deg,
    #ef4444,
    #ef4444 8px,
    #dc2626 8px,
    #dc2626 16px
  );
}

.bar-fill.progress {
  background: repeating-linear-gradient(
    -45deg,
    #06b6d4,
    #06b6d4 8px,
    #0891b2 8px,
    #0891b2 16px
  );
}

.btn-primary,
.btn-secondary {
  height: 38px;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 14px;
  padding: 0 12px;
}

.btn-primary {
  background: #2563eb;
  border-color: #1d4ed8;
  color: #fff;
}

.btn-secondary {
  background: #6b7280;
  color: #fff;
}

.muted {
  color: #6b7280;
}

.error {
  color: #b91c1c;
}

@media (max-width: 980px) {
  .top-row {
    grid-template-columns: 1fr;
  }

  .meta h1 {
    font-size: 34px;
  }

  .meta p {
    font-size: 20px;
  }

  .label {
    font-size: 20px;
  }

  .status-present,
  .status-absent {
    min-width: 150px;
    font-size: 24px;
  }
}
</style>
