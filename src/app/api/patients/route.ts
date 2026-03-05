import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function uploadPhoto(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  file: File,
  prefix: string
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from('patient-photos')
    .upload(path, file, { contentType: file.type })
  if (error) throw new Error(`Photo upload failed: ${error.message}`)
  const { data } = supabase.storage.from('patient-photos').getPublicUrl(path)
  return data.publicUrl
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const name = formData.get('name') as string | null
    const dob = formData.get('dob') as string | null
    const phone = formData.get('phone') as string | null
    const reason = formData.get('reason') as string | null
    const idPhoto = formData.get('id_photo') as File | null
    const insurancePhoto = formData.get('insurance_photo') as File | null

    if (!name || !dob || !phone || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = getServiceClient()

    const idPhotoUrl = idPhoto ? await uploadPhoto(supabase, idPhoto, 'id') : null
    const insurancePhotoUrl = insurancePhoto
      ? await uploadPhoto(supabase, insurancePhoto, 'insurance')
      : null

    const { data, error } = await supabase
      .from('patients')
      .insert({
        name,
        dob,
        phone,
        reason,
        id_photo_url: idPhotoUrl,
        insurance_photo_url: insurancePhotoUrl,
        status: 'waiting_for_forms',
        forms_to_send: [],
      })
      .select('id, name')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
