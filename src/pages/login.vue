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
  if (errors.value.email || errors.value.password) return

  isLoading.value = true
  try {
    await useAuth().login(email.value, password.value)
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status?: number } }
    apiError.value = axiosErr?.response?.status === 401
      ? 'Неверный email или пароль'
      : 'Ошибка сети. Попробуйте ещё раз.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 mb-4">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-slate-900">Добро пожаловать</h1>
        <p class="text-sm text-slate-500 mt-1">Войдите в свой аккаунт</p>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <form @submit.prevent="handleSubmit" novalidate class="space-y-5">
          <div>
            <label for="email" class="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="you@example.com"
              class="w-full border rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              :class="errors.email ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300'"
            />
            <p v-if="errors.email" class="mt-1.5 text-xs text-red-500 flex items-center gap-1">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
              {{ errors.email }}
            </p>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-slate-700 mb-1.5">Пароль</label>
            <input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              placeholder="••••••••"
              class="w-full border rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              :class="errors.password ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300'"
            />
            <p v-if="errors.password" class="mt-1.5 text-xs text-red-500 flex items-center gap-1">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
              {{ errors.password }}
            </p>
          </div>

          <div v-if="apiError" class="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
            {{ apiError }}
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2"
          >
            <svg v-if="isLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ isLoading ? 'Вход...' : 'Войти' }}
          </button>
        </form>
      </div>

      <p class="text-center text-xs text-slate-400 mt-6">
        admin@test.com / 123456 &nbsp;·&nbsp; user@test.com / 123456
      </p>
    </div>
  </div>
</template>
