import { redirect } from 'next/navigation'

// Fasa 2: akan ada registration flow baru dengan IC + selfie verification
// Fasa 1: redirect ke existing provider registration
export default function RegisterCompanionPage() {
  redirect('/register/provider')
}
