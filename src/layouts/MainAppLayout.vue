<script setup lang="ts">
import { computed, ref, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const UserMenu = defineAsyncComponent(() => import('../components/UserMenu.vue'))

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
  return `${name} ${surname}`.trim() || auth.user?.loginName || 'Uzytkownik'
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
        <button class="avatar-btn" @click="toggleMenu" type="button" aria-label="Menu uzytkownika">
          {{ initials }}
        </button>

        <div v-if="isMenuOpen" class="menu">
          <UserMenu :initials="initials" :full-name="fullName" :role="auth.role" @logout="logout" />
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
}

.content {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 24px 24px;
}
</style>
