// functions/send-reminders.ts
import type { Request, Response } from 'express'
import { Resend } from 'resend'
import { addDays, addMonths, addYears, setDay } from 'date-fns'
const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req: Request, res: Response) {
  // 1. Verify cron secret key for security
  if (req.headers['x-cron-secret'] !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const NHOST_GRAPHQL_URL = process.env.NHOST_GRAPHQL_URL!
  const HASURA_ADMIN_SECRET = process.env.NHOST_ADMIN_SECRET!

  try {
    const now = new Date().toISOString()

    // 2. Query Hasura for due, unsent reminders
    const fetchQuery = `
      query GetDueReminders($now: timestamptz!) {
        todos(where: { reminder_at: { _lte: $now }, reminder_sent: { _eq: false } }) {
          id
          title
          details
          users {
            email
          }
        }
      }
    `

    const response = await fetch(NHOST_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
      },
      body: JSON.stringify({ query: fetchQuery, variables: { now } }),
    })

    const { data, errors } = await response.json()
    if (errors) throw new Error(JSON.stringify(errors))

    const dueTodos = data?.todos || []
    if (dueTodos.length === 0) {
      return res.status(200).json({ message: 'No reminders due.' })
    }

    const sentIds: string[] = []

    // 3. Loop through tasks and send email notifications via Resend API
    for (const todo of dueTodos) {
      const userEmail = todo.users?.email
      if (!userEmail) continue

      await resend.emails.send({
        from: 'Todo App <onboarding@resend.dev>',
        to: userEmail,
        subject: `Reminder: ${todo.title}`,
        html: `<p><strong>Task:</strong> ${todo.title}</p>${todo.details ? `<p>${todo.details}</p>` : ''}`,
      })

      const currentReminder = new Date(todo.reminder_at)
      let nextReminder: Date | null = null

      function getNextWeeklyDate(currentDate: Date, customDays: string[]): Date {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        const targetDays = customDays.map(d => d.toLowerCase())
        const nextDate = new Date(currentDate)
        do {
          nextDate.setDate(nextDate.getDate() +1)
        } while(!customDays.includes(dayNames[nextDate.getDay()]))
          return nextDate
      }
      switch(todo.recurrence_type) {
        case 'WEEKLY':
        nextReminder = getNextWeeklyDate(currentReminder, todo.custom_days)
        break

        case 'MONTHLY':
        nextReminder = addMonths(currentReminder, 1)
        break

        case 'YEARLY':
        nextReminder = addYears(currentReminder, 1)
        break
        
        default:
          nextReminder = null
      }

      sentIds.push(todo.id)
    }

    // 4. Update reminder_sent to true so duplicate emails aren't sent
    if (sentIds.length > 0) {
      const updateQuery = `
        mutation MarkSent($ids: [uuid!]!) {
          update_todos(where: { id: { _in: $ids } }, _set: { reminder_sent: true }) {
            affected_rows
          }
        }
      `

      await fetch(NHOST_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
        },
        body: JSON.stringify({ query: updateQuery, variables: { ids: sentIds } }),
      })
    }

    return res.status(200).json({ message: `Successfully sent ${sentIds.length} reminder(s).` })
  } catch (error: any) {
    return res.status(500).json({ error: error.message })
  }
}