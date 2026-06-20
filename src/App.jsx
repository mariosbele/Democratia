import { Navigate, Route, Routes } from 'react-router-dom'
import { MobileFrame } from './components/MobileFrame.jsx'
import { WelcomeLogin } from './screens/WelcomeLogin.jsx'
import { SignUp } from './screens/SignUp.jsx'
import { CreateCredentials } from './screens/CreateCredentials.jsx'
import { ResetCredentials } from './screens/ResetCredentials.jsx'
import { Terms } from './screens/Terms.jsx'
import { AppLayout } from './screens/AppLayout.jsx'
import { MainPage } from './screens/MainPage.jsx'
import { VotingPage } from './screens/VotingPage.jsx'
import { Notifications } from './screens/Notifications.jsx'
import { MyAccount } from './screens/MyAccount.jsx'
import { History } from './screens/History.jsx'
import { Settings } from './screens/Settings.jsx'
import { QAScreen } from './screens/QA.jsx'
import { Privacy } from './screens/Privacy.jsx'
import { Following } from './screens/Following.jsx'

export default function App() {
  return (
    <MobileFrame>
      <Routes>
        {/* Δημόσιες οθόνες (χωρίς σύνδεση) */}
        <Route path="/" element={<WelcomeLogin />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/create-credentials" element={<CreateCredentials />} />
        <Route path="/reset" element={<ResetCredentials />} />
        <Route path="/terms" element={<Terms />} />

        {/* Εφαρμογή (απαιτεί σύνδεση) */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<MainPage />} />
          <Route path="voting/:id" element={<VotingPage />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="account" element={<MyAccount />} />
          <Route path="following" element={<Following />} />
          <Route path="history" element={<History />} />
          <Route path="settings" element={<Settings />} />
          <Route path="qa" element={<QAScreen />} />
          <Route path="privacy" element={<Privacy />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MobileFrame>
  )
}
