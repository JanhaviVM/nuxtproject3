// create a store for the auth state
import { defineStore } from 'pinia'
import type { NhostClient, StoredSession } from '@nhost/nhost-js'

export const useAuthStore = defineStore('auth', () => {
    const authState = reactive<{
        user: StoredSession['user'] | null,
        session: StoredSession | null,
        isLoading: boolean,
        isInitialized: boolean,
    }>({
        user: null,
        session: null,
        isLoading: false,
        isInitialized: false,
    })

    let unsubscribe: (() => void) | null = null

    const isAuthenticated = computed(() => !!authState.session)
    

    const initializeAuth = () => {
        const  { $nhost } = useNuxtApp()
        const session = $nhost.getUserSession() || null
        authState.isLoading = true
        authState.user = session?.user ?? null
        authState.session = session ?? null

        unsubscribe = $nhost.sessionStorage.onChange((currentSession) => {
            reloadSession(currentSession?.refreshTokenId ?? null);
        });

        authState.isLoading = false
        authState.isInitialized = true;
    }

    const cleanup = () => {
        if(unsubscribe) {
            unsubscribe()
            unsubscribe = null
        }
    }

 
    let lastRefreshTokenIdRef: string | null = null;
    
    const reloadSession = (currentRefreshTokenId: string | null) => {
        const  { $nhost } = useNuxtApp()
        if (currentRefreshTokenId !== lastRefreshTokenIdRef) {
          lastRefreshTokenIdRef = currentRefreshTokenId;
      
          // Update local authentication state to match current session
          const currentSession = $nhost.getUserSession();
          authState.isLoading = true
          authState.user = currentSession?.user || null;
          authState.session = currentSession;
          authState.isLoading = false
          authState.isInitialized = true

        }
      };

    return {
        authState,
        initializeAuth,
        cleanup,
        isLoading: computed(() => authState.isLoading),
        isAuthenticated,
        user: computed(() => authState.user),
        session: computed(() => authState.session),
        isInitialized: computed(() => authState.isInitialized),
    }
})