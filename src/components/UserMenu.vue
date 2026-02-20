<script setup lang="ts">
import { computed } from 'vue'

type AppRole = 'teacher' | 'student' | null

const props = defineProps<{
  initials: string
  fullName: string
  role: AppRole
}>()

const emit = defineEmits<{
  (e: 'logout'): void
}>()

const roleLabel = computed(() => {
  if (props.role === 'student') return 'Student'
  if (props.role === 'teacher') return 'Nauczyciel'
  return 'Uzytkownik'
})
</script>

<template>
  <div class="user-menu">
    <p class="name">{{ fullName }}</p>
    <p class="role">{{ roleLabel }}</p>
    <button class="logout-btn" type="button" @click="emit('logout')">Wyloguj</button>
  </div>
</template>

<style scoped>
.user-menu {
  width: 240px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.name {
  margin: 0 0 6px;
  font-weight: 600;
}

.role {
  margin: 0 0 10px;
  color: #4b5563;
  font-size: 14px;
}

.logout-btn {
  width: 100%;
  border: 0;
  border-radius: 8px;
  padding: 9px 12px;
  background: #ef4444;
  color: #fff;
  cursor: pointer;
}
</style>
