import { Link } from 'react-router-dom'
import { IconBack, IconShield } from '../components/Icons.jsx'
import { POLICY_VERSION } from '../context/AppContext.jsx'

// Δημόσια σελίδα: Όροι Χρήσης & Πολιτική Απορρήτου (GDPR) + δοκιμαστικοί χρήστες.
export function Terms() {
  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar bg-white">
      <div className="flex items-center gap-3 px-4 pb-3 pt-7 sm:pt-9">
        <Link to="/" className="-ml-1 rounded-full p-1 text-slate-600 hover:bg-slate-100">
          <IconBack />
        </Link>
        <h1 className="text-lg font-bold">Όροι & Απόρρητο</h1>
      </div>

      <div className="flex-1 space-y-5 px-6 pb-10 pt-2 text-sm leading-relaxed text-slate-700">
        <div className="flex items-start gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-brand-800">
          <IconShield className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Έκδοση πολιτικής: {POLICY_VERSION}. Συμμόρφωση με τον Κανονισμό (ΕΕ) 2016/679 (GDPR).</span>
        </div>

        <Section title="Ποια δεδομένα συλλέγουμε (ελαχιστοποίηση)">
          Για να διασφαλίσουμε ότι κάθε λογαριασμός είναι μοναδικός, κρατάμε <strong>μόνο</strong>:
          ένα μη αναστρέψιμο «αποτύπωμα» (hash) του ΑΦΜ σας, το ονοματεπώνυμό σας (εμφανίζεται
          στα επώνυμα σχόλια) και την ένδειξη ότι έχετε επαληθευμένη ηλικία ψήφου.
          <strong> Δεν αποθηκεύουμε</strong> τον ΑΦΜ, κωδικούς Taxisnet, τηλέφωνο ή ημερομηνία γέννησης.
        </Section>

        <Section title="Η ψήφος σας είναι ανώνυμη">
          Η ψήφος δεν συνδέεται με τα στοιχεία σας — αποθηκεύεται με τρόπο που δεν επιτρέπει να
          ταυτοποιηθεί ο ψηφοφόρος. Τα σχόλια στην κοινότητα είναι επώνυμα.
        </Section>

        <Section title="Ταυτοποίηση & ασφάλεια">
          Η σύνδεση γίνεται μέσω Taxisnet και επιβεβαιώνεται με κωδικό μίας χρήσης (OTP) στο κινητό σας.
          Οι συνεδρίες λήγουν αυτόματα και μπορείτε να αποσυνδεθείτε ανά πάσα στιγμή.
        </Section>

        <Section title="Τα δικαιώματά σας (GDPR)">
          Έχετε δικαίωμα <strong>πρόσβασης</strong> (εξαγωγή των δεδομένων σας) και
          <strong> διαγραφής</strong> λογαριασμού. Και τα δύο γίνονται από το{' '}
          <em>Λογαριασμός → Τα δεδομένα μου</em> μέσα στην εφαρμογή.
          <br /><br />
          <strong>Τι αφαιρείται με τη διαγραφή:</strong> το ονοματεπώνυμό σας, το
          κρυπτογραφικό αποτύπωμα ΑΦΜ και τυχόν επώνυμα σχόλια.
          <br />
          <strong>Τι παραμένει:</strong> οι ψήφοι σας — γιατί είναι πλήρως ανώνυμες
          (δεν συνδέονται με κανένα στοιχείο ταυτότητας) και έχουν ήδη ληφθεί υπόψη
          στα δημοσιευμένα αποτελέσματα. Η αφαίρεσή τους θα αλλοίωνε αποτελέσματα
          που έχει ήδη δει το κοινό.
        </Section>

        <Section title="Δοκιμαστικοί χρήστες (προσομοίωση Taxisnet)">
          Σε αυτό το πρωτότυπο η ταυτοποίηση είναι προσομοίωση. Μπορείτε να συνδεθείτε με:
          <ul className="mt-2 space-y-1">
            {[
              ['mbelechris', 'Μάριος Μπελεχρής'],
              ['epapadopoulou', 'Ελένη Παπαδοπούλου'],
              ['gathanasiou', 'Γιώργος Αθανασίου'],
              ['mnikolaou', 'Μαρία Νικολάου'],
            ].map(([u, name]) => (
              <li key={u} className="rounded-lg bg-slate-50 px-3 py-2">
                <code className="font-semibold">{u}</code> / <code>Demo!2024</code> — {name}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-500">
            Ο χρήστης <code>anilikos</code> απορρίπτεται σκόπιμα (έλεγχος ηλικίας).
          </p>
        </Section>

        <p className="text-xs text-slate-400">
          Σημείωση: πρόκειται για διαδραστικό πρωτότυπο. Πριν από πραγματική χρήση με πολίτες
          απαιτείται επίσημη ταυτοποίηση, έλεγχος ασφαλείας και νομική συμμόρφωση.
        </p>

        <Link to="/" className="btn-primary inline-flex w-full justify-center">Επιστροφή στη σύνδεση</Link>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="mb-1 text-sm font-bold text-ink">{title}</h2>
      <p>{children}</p>
    </div>
  )
}
