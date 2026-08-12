<template>
<div>
<DataTable 
  :value="todos" 
  :loading="tableLoading"
  :rowsPerPageOptions="[5, 10, 15, 20]"
  :rows="rows"
  :first="first"
  v-model:filters="filters"
  :totalRecords="totalRecords"
  :lazy="true"
  scrollable
  scrollHeight="500px"
  paginator
  @page="onPage"
  filterDisplay="menu"
  @filter="onFilter"
>
<template #header>
  <div class="flex justify-content-between align-items-center flex-wrap gap-2">
    <span class="text-xl text-900 font-bold">Todo List</span>
    <div class="flex align-items-center gap-2">
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText
          v-model="globalSearchInput"
          placeholder="Search tasks (3+ characters)..."
        />
      </IconField>
      <Button
        label="Clear filters"
        icon="pi pi-filter-slash"
        severity="secondary"
        outlined
        @click="clearFilters"
      />
      <Button label="Add Task" icon="pi pi-plus" @click="isDialogVisible = true" />
    </div>
  </div>
</template>
<Column field="id" header="Task Id" style="min-width: 8rem">
  <template #body="{ data }">{{ data.id || '—' }}</template>
</Column>
<Column field="users.email" header="User Email" style="min-width: 14rem">
  <template #body="{ data }">{{ data.users?.email || '—' }}</template>
</Column>
<Column field="title" header="Title" style="min-width: 12rem">
  <template #body="{ data }">{{ data.title || '—' }}</template>
</Column>
<Column field="details" header="Details" style="min-width: 14rem">
  <template #body="{ data }">{{ data.details || '—' }}</template>
</Column>
<Column field="created_at" header="Created At" style="min-width: 11rem">
  <template #body="{ data }">
    {{ (data.created_at && new Date(data.created_at).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })) || '—' }}
  </template>
</Column>
<Column field="updated_at" header="Updated At" style="min-width: 11rem">
  <template #body="{ data }">
    {{ (data.updated_at && new Date(data.updated_at).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })) || '—' }}
  </template>
</Column>
<Column field="status" header="Status" filterMatchMode="in" :showFilterMatchModes="true" style="min-width: 12rem">
    <template #body="{ data }">
        {{ data.statuses?.name || '—' }}
    </template>

    <template #filter="{ filterModel }">
        <MultiSelect
            v-model="filterModel.value"
            :options="statusOptions"
            optionLabel="name"
            optionValue="id"
            placeholder="Select Status"
            appendTo="self"
            class="w-full md:w-56"
        />
    </template>
</Column>
<Column field="reminder_at" header="Remind On Date" style="min-width: 11rem">
  <template #body="{ data }">
    {{ (data.reminder_at && new Date(data.reminder_at).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })) || '—' }}
  </template>
</Column>
<Column field="recurrence_type" header="Recurrence" filterMatchMode="in" :showFilterMatchModes="true" style="min-width: 12rem">
  <template #body="{ data }">{{ data.recurrence_type || '—' }}</template>
  <template #filter="{ filterModel }">
      <MultiSelect
        v-model="filterModel.value"
        :options="recurrenceOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Select Recurrence"
        appendTo="self"
        class="w-full md:w-56"
      />
  </template>
</Column>
<Column field="custom_days" header="Remind on Days" filterMatchMode="in" :showFilterMatchModes="true" style="min-width: 12rem">
  <template #body="{ data }">
    {{ (data.custom_days?.length && data.custom_days.join(', ')) || '—' }}
  </template>
  <template #filter="{ filterModel }">
      <MultiSelect
        v-model="filterModel.value"
        :options="dayOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Select Days"
        appendTo="self"
        class="w-full md:w-56"
      />
  </template>
</Column>

<Column header="Actions" frozen alignFrozen="right" style="min-width: 8rem">
  <template #body="slotProps">
        <Button 
      icon="pi pi-pencil" 
      severity="secondary"
      @click="editTodo(slotProps.data); isDialogVisible = true" 
    />
        <Button 
      icon="pi pi-trash" 
      severity="secondary"
      @click="deleteTodo(slotProps.data.id)" 
    />
  </template>
</Column>
</DataTable>
<Drawer v-model:visible="isDialogVisible" position="right" header="Add New Task" :modal="true" :style="{ width: '450px' }" @hide="resetForm">
      <Form :key="task?.id ?? 'add'" :initialValues="initialValues" :resolver="formResolver" @submit="onTaskSubmit" v-slot="$form">
        <div class="flex flex-column gap-2 mb-3">
          <label for="title" class="font-bold">Title</label>
          <InputText id="title" name="title" :invalid="!!$form.title?.invalid" autofocus />
          <Message severity="error" v-if="$form.title?.invalid">{{ $form.title.error.message }}</Message>
        </div>
        
        <div class="flex flex-column gap-2 mb-4">
          <label for="details" class="font-bold">Details</label>
          <Textarea id="details" name="details" :invalid="!!$form.details?.invalid" rows="3" autoResize />
          <Message severity="error" v-if="$form.details?.invalid">{{ $form.details.error.message }}</Message>
        </div>

        <div class="flex flex-column gap-2 mb-4">
          <label for="status" class="font-bold">Status</label>
          <Select
            id="status"
            name="status"
            :options="statusOptions"
            optionLabel="name"
            optionValue="id"
            placeholder="Select a status"
            :invalid="!!$form.status?.invalid"
          />
          <Message severity="error" v-if="$form.status?.invalid">{{ $form.status.error.message }}</Message>
        </div>

        <div class="flex flex-column gap-2 mb-4">
          <label for="reminder_at" class="font-bold">Remind on Date</label>
          <DatePicker 
          id="reminder_at"
          name="reminder_at"
          :minDate="new Date()"
          />
          {{ $form.reminder_at?.value ? new Date($form.reminder_at.value).toISOString() : '' }}
          <Message severity="error" v-if="$form.reminder_at?.invalid">{{ $form.reminder_at.error.message }}</Message>
        </div>

        <div class="flex flex-column gap-2 mb-4">
          <label for="recurrence_type" class="font-bold">Select Recurrence Type</label>
          <Select
            id="recurrence_type"
            name="recurrence_type"
            :options="recurrenceOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select Recurrence Type"
            :invalid="!!$form.recurrence_type?.invalid"
            radio
          />
          <Message severity="error" v-if="$form.recurrence_type?.invalid">{{ $form.recurrence_type.error.message }}</Message>
        </div>

        <div v-if="$form.recurrence_type?.value === 'weekly'" class="text-sm text-color-secondary mb-4">
          Repeats every {{ dayOptions.find(d => d.value === weekdayValues[new Date($form.reminder_at?.value ?? Date.now()).getDay()])?.label }}
          {{ $form.reminder_at?.value ? '(from selected date)' : '(today — pick a date to change)' }}
        </div>

        <div v-if="$form.recurrence_type?.value === 'custom'" class="flex flex-column gap-2 mb-4">
          <label class="font-bold">Repeat on Days</label>
            <MultiSelect
              id="custom_days"
              name="custom_days"
              :options="dayOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select Days"
            />
        </div>

        <div class="flex justify-content-end gap-2">
          <Button type="button" label="Cancel" severity="secondary" text @click="resetForm" />
          <Button type="submit" label="Save Task" severity="primary" />
        </div>
      </Form>
    </Drawer>
</div>
</template>

<script setup lang="ts">
import GetTodos from '@/gql/fetchtasks.gql'
import TodosChanged from '@/gql/subscribetasks.gql'
import AddTodo from '@/gql/addtasks.gql'
import UpdateTodo from '@/gql/updatetasks.gql'
import DeleteTodo from '@/gql/deletetasks.gql'
import GetStatuses from '@/gql/fetchstatuses.gql'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import z from 'zod'
import { useQuery, useMutation, useSubscription } from '@vue/apollo-composable'
import { useToast } from 'primevue/usetoast'
import type { FormSubmitEvent } from '@primevue/forms'
import { Form } from '@primevue/forms'
import { buildHasuraWhere } from '@/utils/BuildTableFilter'
const toast = useToast()
interface Todo {
  id: string
  title: string
  details: string | null
  statuses: {
    id: string
    name: string
  }
  created_at: string
  updated_at: string
  user_id: string
  users: {
    email: string
  } | null
  reminder_at: string | null
  recurrence_type: string
  custom_days: []
}

const isEditTask:boolean = ref(false)

const first = ref(0)   // offset, PrimeVue calls this "first"
const rows = ref(5)    // page size
const totalRecords = ref(0)


// options

const recurrenceOptions = [
  { label: 'Once', value: 'once' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
  { label: 'Custom days', value: 'custom' },
]

const dayOptions = [
  { label: 'Sun', value: 'sun' }, { label: 'Mon', value: 'mon' }, { label: 'Tue', value: 'tue' },
  { label: 'Wed', value: 'wed' }, { label: 'Thu', value: 'thu' }, { label: 'Fri', value: 'fri' }, { label: 'Sat', value: 'sat' },
]

const weekdayValues = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

// options end

// filter task begin

import { FilterMatchMode, FilterOperator } from '@primevue/core/api' // PrimeVue v4 import

const createDefaultFilters = () => ({
  'status': { operator: FilterOperator.AND, constraints: [{ value: [], matchMode: FilterMatchMode.IN }] },
  'recurrence_type': { operator: FilterOperator.AND, constraints: [{ value: [], matchMode: FilterMatchMode.IN }] },
  'custom_days': { operator: FilterOperator.AND, constraints: [{ value: [], matchMode: FilterMatchMode.IN }] },
})

const filters = ref(createDefaultFilters())
const globalSearchInput = ref('')

const searchTerm = computed(() => {
  const term = globalSearchInput.value.trim()
  return term.length >= 3 ? term : null
})

watch(searchTerm, () => {
  first.value = 0
})

// filter task end

const GetTodosVariable = computed(() => ({
  where: buildHasuraWhere(filters.value, searchTerm.value),
  limit: rows.value,
  offset: first.value,
}))

const onPage = (event: { first: number; rows: number; page: number }) => {
  first.value = event.first
  rows.value = event.rows
}

const { onResult, onError, loading, refetch } = useQuery(GetTodos, GetTodosVariable, () => ({
  notifyOnNetworkStatusChange: true,
}))

const onFilter = () => {
  first.value = 0
  refetch()
}

const clearFilters = () => {
  globalSearchInput.value = ''
  filters.value = createDefaultFilters()
  first.value = 0
  refetch()
}

const tableLoading = computed(() => loading.value)

const { onResult: onTodosChanged } = useSubscription(TodosChanged)

let todosSubscriptionReady = false
onTodosChanged(() => {
  if (!todosSubscriptionReady) {
    todosSubscriptionReady = true
    return
  }
  refetch()
})

const todos = ref<Todo[]>([])

onResult((res) => { 
    todos.value = res.data?.todos ?? []
    totalRecords.value = res.data?.todos_aggregate?.aggregate?.count ?? 0
 })

onError((error) => {
  toast.add({ 
    severity: 'error', 
    summary: 'Error Loading Tasks', 
    detail: error.message,
    life:3000 })
})


const { onDone: onDoneDelete, onError: onErrorDelete, mutate: deleteMutation } = useMutation(DeleteTodo)

const deleteTodo = (id: string) => {
  deleteMutation({ id })
}

onDoneDelete(() => {
  refetch()
})

onErrorDelete((error) => {
  toast.add({ 
    severity: 'error', 
    summary: 'Delete Failed', 
    detail: error.message 
  })
})

// add tasks


const isDialogVisible = ref(false)

// 1. Define Zod validation schema
const todoSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(100, 'Title is too long'),
  details: z.string().trim().optional(),
  status: z.string().uuid('Status is required'),
  reminder_at: z.date().nullable(),
  recurrence_type: z.string().nullable(),
  custom_days: z.array(z.string()).nullish()
})


const initialValues = ref({
  title: '',
  details: '',
  status: '',
  reminder_at: new Date(),
  recurrence_type: '',
  custom_days: []
})

// 3. Custom Zod resolver function for PrimeVue Form
const formResolver = zodResolver(todoSchema)


const { mutate: addTodoMutation, onDone: onDoneAdd, onError: onErrorAdd } = useMutation(AddTodo)

const authStore = useAuthStore()

const onTaskSubmit = (e: FormSubmitEvent) => {
  console.log('SUBMIT EVENT:', e)
  console.log('e.valid:', e.valid, 'e.values:', e.values)
  if (!e.valid) return

  const custom_days = e.values.recurrence_type === 'custom'
    ? (e.values.custom_days?.length ? e.values.custom_days : null)
    : e.values.recurrence_type === 'weekly'
      ? [weekdayValues[(e.values.reminder_at ?? new Date()).getDay()]]
      : null

  if(isEditTask.value === true) {
    editMutation({
      id: task.value.id,
      changes: {
      user_id: task.value.user_id,
      title: e.values.title,
      details: e.values.details || null,
      status: e.values.status,
      reminder_at: e.values.reminder_at ? e.values.reminder_at.toISOString() : null, 
      recurrence_type: e.values.recurrence_type, 
      custom_days
    }
  })
  return
  }
  
  addTodoMutation({
    object: {
      user_id: authStore.user?.id,
      title: e.values.title,
      details: e.values.details || null,
      status: e.values.status,
      reminder_at: e.values.reminder_at ? e.values.reminder_at.toISOString() : null, 
      recurrence_type: e.values.recurrence_type, 
      custom_days
    }
  })


}

onDoneAdd(() => {
  refetch()
  isDialogVisible.value = false
  initialValues.value = { title: '', details: '', status: '', reminder_at: new Date(), recurrence_type: '', custom_days: [] }
  task.value = null
})

// statuses

interface Status {
  id: string
  name: string
}

const { onResult: onStatusResult } = useQuery(GetStatuses)
const statusOptions = ref<Status[]>([])

onStatusResult((res) => {
  statusOptions.value = res.data?.status ?? []
})

// edit form button

const { mutate: editMutation, onDone: onDoneEdit, onError: onErrorEdit } = useMutation(UpdateTodo)

interface Task {
  id: string,
  title: string,
  details: string,
  status: string,
  reminder_at: string,
  recurrence_type: string,
  custom_days: []
}

const task = ref<Task | null>(null)

const editTodo = (data: Todo) => {
  initialValues.value = {
    title: data.title,
    details: data.details ? (data.details as string) : '',
    status: data.statuses.id || '',
    reminder_at: data.reminder_at ? new Date(data.reminder_at) : null,
    recurrence_type: data.recurrence_type ? data.recurrence_type : '',
    custom_days: data.custom_days ? data.custom_days : []
  }
  task.value = {
  id: data.id,
  title: data.title,
  details: data.details ?? '',
  status: data.statuses?.id ?? '',
  reminder_at: data.reminder_at ?? '',
  recurrence_type: data.recurrence_type ?? '',
  custom_days: data.custom_days ?? []
  }
  isEditTask.value = true
}

const resetForm = () => {
  isDialogVisible.value = false 
  isEditTask.value = false
  task.value = null
  initialValues.value = { title: '', details: '', status: '', reminder_at: new Date(), recurrence_type: '', custom_days: [] }
}


onDoneEdit(() => {
  refetch()
  isDialogVisible.value = false
  isEditTask.value = false
  task.value = null
  initialValues.value = { title: '', details: '', status: '', reminder_at: new Date(), recurrence_type: '', custom_days: [] }
})

onErrorEdit((error) => {
  toast.add({ 
    severity: 'error', 
    summary: 'Edit Failed', 
    detail: error.message,
    life: 3000
  })
  isEditTask.value = false
  task.value = null
})

// paginator logic
</script>