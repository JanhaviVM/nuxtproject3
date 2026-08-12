export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  if (import.meta.server) return 
  // Wait until auth state has been initialized before making redirect decisions
  if (!authStore.isInitialized) {
    authStore.initializeAuth()
  }

  const isAuthPage = to.path === '/signin'

  if (!authStore.isAuthenticated && !isAuthPage) {
    return navigateTo('/signin')
  }

  if (authStore.isAuthenticated && isAuthPage) {
    return navigateTo('/profile')
  }
})