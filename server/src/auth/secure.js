import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
import { config } from '../config.js'

// HMAC (μη αναστρέψιμο) με το μυστικό ταυτοποίησης — για ΑΦΜ, OTP, session tokens.
export function hmac(value) {
  return createHmac('sha256', config.auth.secret).update(String(value)).digest('hex')
}

// Τυχαίο, μη προβλέψιμο token (για session).
export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString('hex')
}

// Εξαψήφιο OTP (κρυπτογραφικά τυχαίο).
export function randomOtp() {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

// Σύγκριση σταθερού χρόνου (αποτρέπει timing attacks σε tokens/κωδικούς).
export function safeEqual(a, b) {
  const ba = Buffer.from(String(a ?? ''))
  const bb = Buffer.from(String(b ?? ''))
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}
