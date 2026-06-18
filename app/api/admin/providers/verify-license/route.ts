import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAdmin } from '@/lib/api/handler'
import { parseBody } from '@/lib/api/parse'
import { verifyProviderLicense } from '@/lib/use-cases/verify-provider-license'

const schema = z.object({
  licenseId: z.string(),
  providerId: z.string(),
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().optional(),
})

export const POST = withAdmin(async ({ user, req }) => {
  const input = await parseBody(req, schema)
  await verifyProviderLicense({ ...input, adminId: user.id })
  return NextResponse.json({ success: true, action: input.action === 'approve' ? 'approved' : 'rejected' })
})
