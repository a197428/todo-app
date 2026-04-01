<script setup lang="ts">
import { onMounted } from 'vue'

const { initAuth } = useAuth()

onMounted(() => {
  initAuth()
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>
