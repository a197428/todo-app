<template>
  <input
    type="text"
    :value="value"
    placeholder="Поиск по названию..."
    class="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
    @input="emit('update:search', ($event.target as HTMLInputElement).value)"
  />
</template>

<script setup lang="ts">
interface Props {
  value?: string
}

withDefaults(defineProps<Props>(), {
  value: '',
})

const emit = defineEmits<{
  'update:search': [value: string]
}>()
</script>
