import { createClient } from '@nhost/nhost-js'


export default defineNuxtPlugin((nuxtApp) => {
    const config = useRuntimeConfig()

    const nhost = createClient({
        region: config.public.nhostRegion as string,
        subdomain: config.public.nhostSubdomain as string,
    })


    return {
        provide: {
            nhost,
        },
    }
})