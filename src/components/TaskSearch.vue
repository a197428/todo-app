<script setup lang="ts">
import { Search } from 'lucide-vue-next'

interface Props {
  value?: string
}

withDefaults(defineProps<Props>(), { value: '' })

const emit = defineEmits<{ 'update:search': [value: string] }>()
</script>

<template>
  <div class="relative">
    <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    <input
      type="text"
      :value="value"
      placeholder="Поиск задач..."
      class="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-slate-300 transition-all"
      @input="emit('update:search', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>