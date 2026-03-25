import { NextResponse } from 'next/server'

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function toIcsDate(date: Date) {
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  )
}

function buildTrainingIndexes(sessionsPerWeek: number) {
  const count = Math.max(1, Math.min(7, sessionsPerWeek))
  const indexes = new Set<number>()
  for (let i = 0; i < count; i += 1) {
    indexes.add(Math.floor((i * 7) / count) % 7)
  }
  for (let i = 0; indexes.size < count && i < 7; i += 1) indexes.add(i)
  return Array.from(indexes).sort((a, b) => a - b)
}

const RRULE_BY_WEEKDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessions = Math.max(1, Math.min(7, Number(searchParams.get('sessions') || '3')))
  const weekdays = buildTrainingIndexes(sessions).map((idx) => RRULE_BY_WEEKDAY[idx]).join(',')
  const start = new Date()
  start.setHours(18, 0, 0, 0)
  const end = new Date(start)
  end.setMinutes(end.getMinutes() + 50)
  const uid = `fitpulse-plan-${Date.now()}@fitpulse`
  const now = toIcsDate(new Date())
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FitPulse//Training Plan//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    'SUMMARY:Séance FitPulse',
    'DESCRIPTION:Séance planifiée automatiquement depuis FitPulse.',
    `RRULE:FREQ=WEEKLY;BYDAY=${weekdays}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="fitpulse-plan.ics"',
      'Cache-Control': 'no-store',
    },
  })
}
