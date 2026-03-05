import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getServiceClient()

    const { data: patient, error } = await supabase
      .from('patients')
      .select('name, created_at, form_submission_url')
      .eq('id', id)
      .single()

    if (error || !patient?.form_submission_url) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 })
    }

    // Build filename: LastName_FirstName-YYYY-MM-DD_HHmm.pdf
    const nameParts = patient.name.trim().split(/\s+/)
    const firstName = nameParts[0] ?? 'Patient'
    const lastName = nameParts.slice(1).join('_') || firstName
    const ts = new Date(patient.created_at)
    const pad = (n: number) => String(n).padStart(2, '0')
    const timestamp = `${ts.getFullYear()}-${pad(ts.getMonth() + 1)}-${pad(ts.getDate())}_${pad(ts.getHours())}${pad(ts.getMinutes())}`
    const filename = `${lastName}_${firstName}-${timestamp}.pdf`

    // Proxy the PDF from Supabase Storage so we can set Content-Disposition
    const pdfRes = await fetch(patient.form_submission_url)
    if (!pdfRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch PDF' }, { status: 502 })
    }

    const pdfBytes = await pdfRes.arrayBuffer()

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
