// SMS provider configuration
// Set SMS_PROVIDER to 'telnyx' or 'twilio' to switch between providers
export const SMS_PROVIDER = (process.env.SMS_PROVIDER ?? 'twilio') as 'twilio' | 'telnyx'
