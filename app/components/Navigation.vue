<template>
    <div class="sticky top-0 z-50 px-4 py-3 items-center justify-between bg-gray-900">
        <div class="flex items-center gap-2">
            <Button @click="handleSignOut" >Sign Out</Button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/authStore'
const authStore = useAuthStore()

const  { $nhost } = useNuxtApp()
const router = useRouter()
const toast = useToast()

const handleSignOut = async (): Promise<void> => {
    try {
        if(authStore.session) {
            await $nhost.auth.signOut({
                refreshToken: authStore.session.refreshToken,
            })
            authStore.initializeAuth()
        }
        toast.add({
            summary: `Hello`,
            severity: 'success',
            detail: 'Logout Successful!',
            life: 3000,
        })
        router.push("/signin")
        
    } catch(err: unknown) {
        toast.add({
            summary: `Hello`,
            severity: 'error',
            detail: 'Logout unsuccessful!',
            life: 3000,
        })
    }
}
</script>