<template>
<div>
Welcome {{ authStore.user?.email }}
<TodoTable />
</div>
</template>
<script setup lang="ts">
definePageMeta({
    layout: 'auth',
    middleware: 'auth'
})
import { useAuthStore } from '~/stores/authStore'
const authStore = useAuthStore()

</script>