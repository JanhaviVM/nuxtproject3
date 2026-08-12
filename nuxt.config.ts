// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'
import Lara from '@primevue/themes/lara'
import graphqlLoader from 'vite-plugin-graphql-loader'
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: ['~/assets/main.css', 'primeicons/primeicons.css',],
  vite: {
    plugins: [
      tailwindcss(),
      graphqlLoader()
    ]
  },
  runtimeConfig: {
    public: {
      nhostRegion: process.env.NHOST_REGION,
      nhostSubdomain: process.env.NHOST_SUBDOMAIN,
    },
  },
  modules: ['@primevue/nuxt-module', '@pinia/nuxt'],
  primevue: {
    options: {
      theme: {
        preset: Lara, // Pass the object here, not the string 'lara'
        options: {
          darkModeSelector: '.p-dark',
          cssLayer: {
            name: 'primevue',
            order: 'theme, base, primevue, utilities' // Keeps Tailwind v4 layers and PrimeVue in harmony
          }
        }
      }
    },
    composables: {
      include: ['useToast']
    }
  }
})
