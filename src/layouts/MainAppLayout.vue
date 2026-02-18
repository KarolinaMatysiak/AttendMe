<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const isMenuOpen = ref(false)

const initials = computed(() => {
  const name = auth.user?.name?.trim() ?? ''
  const surname = auth.user?.surname?.trim() ?? ''
  const first = name.charAt(0).toUpperCase()
  const second = surname.charAt(0).toUpperCase()
  return `${first}${second}` || 'U'
})

const fullName = computed(() => {
  const name = auth.user?.name ?? ''
  const surname = auth.user?.surname ?? ''
  return `${name} ${surname}`.trim() || auth.user?.loginName || 'Użytkownik'
})

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

async function logout() {
  auth.logout()
  isMenuOpen.value = false
  await router.push({ name: 'login-page' })
}
</script>

<template>
  <div class="main-layout">
    <header class="topbar">
      <div class="spacer"></div>

      <div class="user-menu-wrap">
        <button class="avatar-btn" @click="toggleMenu" type="button" aria-label="Menu użytkownika">
          {{ initials }}
        </button>

        <div v-if="isMenuOpen" class="menu">
          <p class="name">{{ fullName }}</p>
          <p class="role">Rola: Nauczyciel</p>
          <button class="logout-btn" @click="logout" type="button">Wyloguj</button>
        </div>
      </div>
    </header>

    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.main-layout {
  min-height: 100vh;
  background: #f5f7fb;
}

.topbar {
  height: 72px;
  padding: 0 28px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.spacer {
  flex: 1;
}

.user-menu-wrap {
  position: relative;
}

.avatar-btn {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 0;
  background: #111827;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.menu {
  position: absolute;
  right: 0;
  top: 50px;
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

.content {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 24px 28px;
}
</style>
