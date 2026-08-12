<template>
    <div class="flex min-h-[80vh] items-center justify-center px-4">
        <Card class="w-full max-w-md">
            <template #title>SignIn</template>
            <template #content>
                <Form 
                v-slot="$form" @submit="login" :resolver="resolver"
                class="flex flex-col gap-4"
                >
                <div class="flex flex-col gap-2">
                    <Label for="email" class="text-sm font-medium">Enter Your Email</Label>
                    <InputText id="email" name="email" />
                    <Message severity="error" v-if="$form.email?.invalid">Please enter a valid email id</Message>
                </div>
                <div class="flex flex-col gap-2">
                    <Label for="email" class="text-sm font-medium">Enter Your Password</Label>
                    <InputText name="password" type="password" />
                    <Message severity="error" v-if="$form.password?.invalid">Please enter a valid password</Message>
                </div>
                <Button type="submit" :disabled="!$form.valid">Sign In</Button>
                </Form>
            </template>
        </Card>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    middleware: 'auth'
})

import type FormSubmitEvent from 'primevue/forms/FormSubmitEvent'
import { useToast } from 'primevue/usetoast'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import z from 'zod';

const  { $nhost } = useNuxtApp()
const router = useRouter()

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Must be at least 6 characters')
})

const resolver = zodResolver(loginSchema)

const toast = useToast()
const login = async (event: FormSubmitEvent) => {
    const { email, password } = event.values
    try {
        const response = await $nhost.auth.signInEmailPassword({
            email,
            password,
        })
        if(response.body?.session) {
            router.push("/profile")
            toast.add({
                summary: `Hello ${email}`,
                severity: 'success',
                detail: 'Login Successful!',
                life: 3000,
            })
        } else {
            throw new Error("Failed to sign in. Please check your credentials.")
        }
    } catch (err) {
        toast.add({
        summary: `Hello ${email}`,
        severity: 'error',
        detail: 'Login unsuccessful!',
        life: 3000,
    })

    }
}

</script>