<script setup lang="ts">
import { ref } from 'vue'
import { validateLoginForm } from '../utils/auth'
import type { ValidationErrors } from '../utils/auth'
import { useAuth } from '../composables/useAuth'

const email = ref('')
const password = ref('')
const errors = ref<ValidationErrors>({})
const apiError = ref<string | null>(null)
const isLoading = ref(false)

async function handleSubmit() {
  apiError.value = null
  errors.value = validateLoginForm(email.value, password.value)

  if (errors.value.email || errors.value.password) {
    return
  }

  isLoading.value = true
  try {
    await useAuth().login(email.value, password.value)
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status?: number } }
    if (axiosErr?.response?.status === 401) {
      apiError.value = 'Invalid credentials'
    } else {
      apiError.value = 'Network error. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="w-full max-w-sm bg-white rounded-lg shadow p-8">
      <h1 class="text-2xl font-semibold text-gray-800 mb-6 text-center">Sign in</h1>

      <form @submit.prevent="handleSubmit" novalidate>
        <div class="mb-4">
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="errors.email ? 'border-red-500' : 'border-gray-300'"
          />
          <p v-if="errors.email" class="mt-1 text-xs text-red-600">{{ errors.email }}</p>
        </div>

        <div class="mb-6">
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="errors.password ? 'border-red-500' : 'border-gray-300'"
          />
          <p v-if="errors.password" class="mt-1 text-xs text-red-600">{{ errors.password }}</p>
        </div>

        <p v-if="apiError" class="mb-4 text-sm text-red-600 text-center">{{ apiError }}</p>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ isLoading ? 'Загрузка...' : 'Sign in' }}
        </button>
      </form>
    </div>
  </div>
</template>
