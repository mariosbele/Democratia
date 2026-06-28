import { config } from '../config.js'
import { ageFromBirthDate, findCitizen, MIN_VOTING_AGE } from './directory.js'
import { hmac } from './secure.js'
import { upsertAccount, createSession } from '../models/accounts.js'

// Σύνδεση μέσω Taxisnet (gov.gr/GSIS).
//
// Στην ΠΡΑΓΜΑΤΙΚΟΤΗΤΑ ο πολίτης ταυτοποιείται απευθείας στην κρατική υπηρεσία
// (gov.gr OAuth) — εκεί γίνεται και η διπλή ταυτοποίηση. Η εφαρμογή απλώς
// λαμβάνει την επαληθευμένη ταυτότητα και ανοίγει συνεδρία. Εδώ προσομοιώνουμε
// αυτό το αποτέλεσμα με έναν εικονικό κατάλογο πολιτών (directory.js).
//
// Επιστρέφει { ok, token, account } ή { ok:false, reason }.
export function login(username, password) {
  const citizen = findCitizen(username, password)
  if (!citizen) return { ok: false, reason: 'invalid_credentials' }

  const age = ageFromBirthDate(citizen.birthDate)
  if (age < MIN_VOTING_AGE) return { ok: false, reason: 'underage', minAge: MIN_VOTING_AGE }

  // ΕΛΑΧΙΣΤΟΠΟΙΗΣΗ: κρατάμε μόνο hash ΑΦΜ, όνομα, και «επαληθευμένη ηλικία».
  const account = upsertAccount({
    afmHash: hmac('afm:' + citizen.afm),
    fullName: citizen.fullName,
    ageVerified: true,
  })
  const token = createSession(account.id, config.auth.sessionTtlMs)
  return { ok: true, token, account: publicAccount(account) }
}

export function publicAccount(account) {
  return {
    id: account.id,
    fullName: account.full_name,
    ageVerified: !!account.age_verified,
  }
}
