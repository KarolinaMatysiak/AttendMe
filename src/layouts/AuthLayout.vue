<script setup lang="ts">
</script>

<template>
  <main class="auth-layout">
    <section class="auth-shell">
      <header class="auth-header">
        <h1>AttendMe</h1>
        <p>Logowanie do systemu obecności</p>
      </header>

      <RouterView />
    </section>
  </main>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;

}

.auth-shell {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
}

.auth-header {
  margin-bottom: 20px;
}

.auth-header h1 {
  margin: 0 0 8px;
  font-size: 1.5rem;
}

.auth-header p {
  margin: 0;
  color: #4b5563;
}
</style>
