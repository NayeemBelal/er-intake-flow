import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getServiceClient()

    const formData = await request.formData()
    const pdfFile = formData.get('pdf') as File | null
    const fieldValuesRaw = formData.get('fieldValues') as string | null
    const fieldValues = fieldValuesRaw ? JSON.parse(fieldValuesRaw) : null

    let submissionUrl: string | null = null

    if (pdfFile) {
      const path = `${id}/filled.pdf`
      const arrayBuffer = await pdfFile.arrayBuffer()

      const { error: uploadError } = await supabase.storage
        .from('patient-forms')
        .upload(path, arrayBuffer, { contentType: 'application/pdf', upsert: true })

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

      const { data } = supabase.storage.from('patient-forms').getPublicUrl(path)
      submissionUrl = data.publicUrl
    }

    const update: Record<string, unknown> = { status: 'submitted' }
    if (submissionUrl) update.form_submission_url = submissionUrl
    if (fieldValues) update.form_field_values = fieldValues

    const { error } = await supabase.from('patients').update(update).eq('id', id)
    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, submissionUrl })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
