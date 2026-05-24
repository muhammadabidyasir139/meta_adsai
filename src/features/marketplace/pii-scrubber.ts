/**
 * Scrub PII (Personally Identifiable Information) from text
 * Compliance with UU PDP (Indonesia Data Privacy)
 */
export function scrubPII(text: string): string {
  if (!text) return "";

  // 1. Scrub Indonesian Phone Numbers
  const phoneRegex = /(\+62|62|0)8[1-9][0-9]{6,10}/g;
  
  // 2. Scrub Emails
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  
  // 3. Scrub Potential Names/Addresses (Heuristic: [REDACTED] placeholder)
  // This is a basic implementation for MVP 1
  let scrubbed = text
    .replace(phoneRegex, "[PHONE_REDACTED]")
    .replace(emailRegex, "[EMAIL_REDACTED]");

  return scrubbed;
}

/**
 * Example usage:
 * scrubPII("Halo admin, saya Budi. Tolong hubungi saya di 08123456789 atau email budi@gmail.com")
 * -> "Halo admin, saya Budi. Tolong hubungi saya di [PHONE_REDACTED] atau email [EMAIL_REDACTED]"
 */
