import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRM(amount: number) {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
  }).format(amount)
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('ms-MY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatWAPhone(phone: string): string {
  const clean = phone.replace(/[\s\-\(\)\+]/g, '')
  if (clean.startsWith('60')) return clean
  if (clean.startsWith('0')) return '60' + clean.slice(1)
  return '60' + clean
}

export function generateBookingCode() {
  const prefix = 'TMN'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}
