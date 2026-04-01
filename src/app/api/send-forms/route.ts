import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SMS_PROVIDER } from '@/lib/sms-config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { patientId, forms } = await req.json()

    if (!patientId || !Array.isArray(forms) || forms.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch patient for phone number
    const { data: patient, error: fetchError } = await supabase
      .from('patients')
      .select('phone, name')
      .eq('id', patientId)
      .single()

    if (fetchError || !patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Build the form link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    const formUrl = `${baseUrl}/form/${patientId}`

    // Update patient: set forms_to_send + status
    const { error: updateError } = await supabase
      .from('patients')
      .update({
        forms_to_send: forms,
        status: 'filling_forms',
      })
      .eq('id', patientId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 })
    }

    // Send SMS via configured provider
    const formList = forms
      .map((f: string) => f.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()))
      .join(', ')
    const smsBody = `Hi ${patient.name}, please complete your ER intake forms (${formList}) here: ${formUrl}`

    if (SMS_PROVIDER === 'telnyx') {
      const telnyxApiKey = process.env.TELNYX_API_KEY
      const telnyxFrom = process.env.TELNYX_PHONE_NUMBER

      if (telnyxApiKey && telnyxFrom && patient.phone) {
        const Telnyx = (await import('telnyx')).default
        const client = new Telnyx({ apiKey: telnyxApiKey })
        const digits = patient.phone.replace(/\D/g, '')
        const toNumber = digits.startsWith('1') ? `+${digits}` : `+1${digits}`
        await client.messages.send({
          from: telnyxFrom,
          to: toNumber,
          text: smsBody,
        })
      }
    } else {
      const twilioSid = process.env.TWILIO_ACCOUNT_SID
      const twilioToken = process.env.TWILIO_AUTH_TOKEN
      const twilioFrom = process.env.TWILIO_PHONE_NUMBER

      if (twilioSid && twilioToken && twilioFrom && patient.phone) {
        const twilio = (await import('twilio')).default
        const client = twilio(twilioSid, twilioToken)
        await client.messages.create({
          body: smsBody,
          from: twilioFrom,
          to: patient.phone,
        })
      }
    }

    return NextResponse.json({ success: true, formUrl })
  } catch (err) {
    console.error('send-forms error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
