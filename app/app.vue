<template>
  <div>
  <Toast />
    <NuxtLayout>
      <NuxtPage v-if="authStore.isInitialized" />
    </NuxtLayout>
  </div>
</template>
<script setup lang="ts">
import { useAuthStore } from '~/stores/authStore'
const authStore = useAuthStore()

onMounted(() => {
authStore.initializeAuth()

})
</script>

