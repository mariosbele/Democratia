import { createHmac } from 'node:crypto'
import { config } from '../config.js'

// Μετατρέπει ένα αναγνωριστικό ψηφοφόρου (opaque token από τον client) σε
// μη αναστρέψιμο hash, δεμένο με το συγκεκριμένο ψήφισμα. Έτσι:
//   • κανένα προσωπικό στοιχείο δεν αποθηκεύεται,
//   • δεν μπορεί κανείς να συνδέσει την ψήφο με τον χρήστη,
//   • εξασφαλίζεται «μία ψήφος ανά χρήστη ανά ψήφισμα» (μέσω UNIQUE constraint).
export function hashVoter(votingId, voterToken) {
  const token = String(voterToken ?? '').trim()
  if (!token) throw new Error('missing_voter_token')
  return createHmac('sha256', config.voterSecret).update(`${votingId}:${token}`).digest('hex')
}
