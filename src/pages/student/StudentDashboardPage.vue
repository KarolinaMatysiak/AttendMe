<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import SessionsFilterBar from '../../components/SessionsFilterBar.vue'
import type {
  CourseSessionListFilters,
  CourseSessionListItem,
  CourseSessionListItemPagedList,
} from '../../backend/AttendMeBackendClientBase'

type DateFilter = 'today' | 'week' | 'month' | 'future' | 'past' | 'all'

const auth = useAuthStore()
const router = useRouter()

const isLoading = ref(false)
const error = ref<string | null>(null)
const sessions = ref<CourseSessionListItem[]>([])

const dateFilter = ref<DateFilter>('month')
const search = ref('')

let debounceTimer: number | undefined

function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function endOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

function getDateRange(filter: DateFilter): Pick<CourseSessionListFilters, 'dateStart' | 'dateEnd'> {
  const now = new Date()

  if (filter === 'today') {
    return { dateStart: startOfDay(now), dateEnd: endOfDay(now) }
  }

  if (filter === 'week') {
    const day = now.getDay() || 7
    const monday = startOfDay(new Date(now))
    monday.setDate(monday.getDate() - day + 1)

    const sunday = endOfDay(new Date(monday))
    sunday.setDate(sunday.getDate() + 6)

    return { dateStart: monday, dateEnd: sunday }
  }

  if (filter === 'month') {
    const first = new Date(now.getFullYear(), now.getMonth(), 1)
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    return { dateStart: first, dateEnd: last }
  }

  if (filter === 'future') {
    return { dateStart: startOfDay(now) }
  }

  if (filter === 'past') {
    const yesterdayEnd = new Date(startOfDay(now).getTime() - 1)
    return { dateEnd: yesterdayEnd }
  }

  return {}
}

const dateTimeFormatter = new Intl.DateTimeFormat('pl-PL', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

function formatDate(value?: Date) {
  if (!value) return '-'
  return dateTimeFormatter.format(new Date(value))
}

async function loadSessions() {
  isLoading.value = true
  error.value = null

  try {
    const range = getDateRange(dateFilter.value)

    const result: CourseSessionListItemPagedList = await auth.backend.courseStudentSessionsGet({
      pageNumber: 1,
      pageSize: 999999,
      filters: {
        search: search.value.trim() || undefined,
        ...range,
      },
    })

    sessions.value = result.items ?? []
  } catch (e: any) {
    error.value = e?.detail ?? e?.message ?? 'Nie udalo sie pobrac listy zajec.'
    sessions.value = []
  } finally {
    isLoading.value = false
  }
}

function scheduleReload() {
  if (debounceTimer) window.clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => {
    loadSessions()
  }, 300)
}

function openDetails(sessionId?: number) {
  if (!sessionId) return
  router.push({ name: 'student-session-details', params: { sessionId: String(sessionId) } })
}

watch([dateFilter, search], scheduleReload)

onMounted(loadSessions)
</script>

<template>
  <section class="student-dashboard">
    <SessionsFilterBar
      :date-filter="dateFilter"
      :search="search"
      @update:date-filter="dateFilter = $event"
      @update:search="search = $event"
    />

    <p v-if="error" class="error">{{ error }}</p>
    <p v-else-if="isLoading">Ladowanie...</p>
    <p v-else-if="sessions.length === 0">Brak zajec dla wybranych filtrow.</p>

    <ul v-else class="session-list">
      <li
        v-for="item in sessions"
        :key="item.courseSessionId"
        class="session-item"
        @click="openDetails(item.courseSessionId)"
      >
        <div class="line1">
          <strong>{{ item.courseName || '-' }}</strong>
          <span>{{ item.courseGroupName || '-' }}</span>
        </div>
        <div class="line2">
          <span>{{ formatDate(item.dateStart) }}</span>
          <span>{{ item.locationName || 'Brak lokalizacji' }}</span>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.student-dashboard {
  padding: 8px 0;
}

.session-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 12px;
}

.session-item {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 14px 16px;
  cursor: pointer;
}

.session-item:hover {
  border-color: #9ca3af;
}

.line1,
.line2 {
  display: grid;
  grid-template-columns: 1fr auto;
  column-gap: 16px;
  align-items: center;
}

.line2 {
  margin-top: 8px;
  color: #4b5563;
  font-size: 14px;
}

.error {
  color: #b91c1c;
}

@media (max-width: 900px) {
  .line1,
  .line2 {
    grid-template-columns: 1fr;
    row-gap: 4px;
  }
}
</style>
