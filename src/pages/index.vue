<script setup lang="ts">
import { useAuth } from '../composables/useAuth'

const { user, isAdmin, logout } = useAuth()
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow px-6 py-4 flex items-center justify-between">
      <h1 class="text-xl font-semibold text-gray-800">ToDo App</h1>
      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-600">
          {{ user?.email }}
          <span v-if="isAdmin" class="ml-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">admin</span>
        </span>
        <button
          @click="logout"
          class="text-sm text-red-600 hover:text-red-800 transition-colors"
        >
          Выйти
        </button>
      </div>
    </header>

    <main class="p-6">
      <p class="text-gray-500">Список задач появится здесь.</p>
    </main>
  </div>
</template>
