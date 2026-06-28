// ────────────────────────────────────────────────────────────────────────────
// ΠΡΟΣΟΜΟΙΩΣΗ Taxisnet (GSIS) — εικονικός κατάλογος πολιτών.
//
// Στην πραγματικότητα η ταυτοποίηση γίνεται μέσω της κρατικής υπηρεσίας
// (gov.gr / GSIS, OAuth) — ΔΕΝ χειριζόμαστε ποτέ κωδικούς Taxisnet. Εδώ είναι
// ΜΟΝΟ προσομοίωση για το πρωτότυπο.
//
// Κάθε εγγραφή έχει τα στοιχεία που θα επέστρεφε η κρατική υπηρεσία μετά από
// επιτυχή σύνδεση. Από αυτά κρατάμε ΜΟΝΟ τα ελάχιστα (δες server/SECURITY.md).
// ────────────────────────────────────────────────────────────────────────────

// Ελάχιστη ηλικία ψήφου (Ελλάδα: 17).
export const MIN_VOTING_AGE = 17

export const TAXISNET_CITIZENS = [
  { username: 'mbelechris',    password: 'Demo!2024', afm: '123456782', fullName: 'Μάριος Μπελεχρής',     birthDate: '1990-05-12' },
  { username: 'epapadopoulou', password: 'Demo!2024', afm: '234567893', fullName: 'Ελένη Παπαδοπούλου',   birthDate: '1985-09-23' },
  { username: 'gathanasiou',   password: 'Demo!2024', afm: '345678901', fullName: 'Γιώργος Αθανασίου',    birthDate: '1978-02-03' },
  { username: 'mnikolaou',     password: 'Demo!2024', afm: '456789012', fullName: 'Μαρία Νικολάου',       birthDate: '2005-11-30' },
  // Ανήλικος — για δοκιμή του ελέγχου ηλικίας (θα ΑΠΟΡΡΙΦΘΕΙ):
  { username: 'anilikos',      password: 'Demo!2024', afm: '567890123', fullName: 'Ανήλικος Δοκιμαστικός', birthDate: '2012-01-01' },
]

export function ageFromBirthDate(birthDate, now = new Date()) {
  const b = new Date(birthDate)
  let age = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--
  return age
}

// Αναζήτηση πολίτη με διαπιστευτήρια (προσομοίωση επιτυχούς σύνδεσης Taxisnet).
export function findCitizen(username, password) {
  const u = String(username ?? '').trim().toLowerCase()
  const p = String(password ?? '')
  return (
    TAXISNET_CITIZENS.find((c) => c.username.toLowerCase() === u && c.password === p) ?? null
  )
}
