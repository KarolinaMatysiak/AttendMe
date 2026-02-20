<script setup lang="ts">
type DateFilter = 'today' | 'week' | 'month' | 'future' | 'past' | 'all'

const props = defineProps<{
  dateFilter: DateFilter
  search: string
}>()

const emit = defineEmits<{
  (e: 'update:dateFilter', value: DateFilter): void
  (e: 'update:search', value: string): void
}>()

function onDateFilterChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value as DateFilter
  emit('update:dateFilter', value)
}

function onSearchInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  emit('update:search', value)
}
</script>

<template>
  <div class="search-bar">
    <select :value="props.dateFilter" @change="onDateFilterChange">
      <option value="today">Dzisiaj</option>
      <option value="week">Biezacy tydzien</option>
      <option value="month">Biezacy miesiac</option>
      <option value="future">Przyszle</option>
      <option value="past">Minione</option>
      <option value="all">Wszystkie</option>
    </select>

    <input
      :value="props.search"
      type="text"
      placeholder="Szukaj: przedmiot, grupa, lokalizacja..."
      @input="onSearchInput"
    />
  </div>
</template>

<style scoped>
.search-bar {
  display: grid;
  grid-template-columns: 260px minmax(420px, 1fr);
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
}

.search-bar select,
.search-bar input {
  height: 42px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0 12px;
  background: #fff;
  font-size: 15px;
}

@media (max-width: 900px) {
  .search-bar {
    grid-template-columns: 1fr;
  }
}
</style>
