import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('provider_availabilities')
    .select('day_of_week, start_time, end_time')
    .eq('profile_id', id)
    .eq('is_recurring', true)
    .eq('is_available', true)
    .order('day_of_week')
    .order('start_time')

  if (error) return NextResponse.json({ slots: [] })

  return NextResponse.json({
    slots: (data ?? []).map((s) => ({
      dayOfWeek: s.day_of_week as number,
      startTime: s.start_time as string,
      endTime: s.end_time as string,
    })),
  })
}
