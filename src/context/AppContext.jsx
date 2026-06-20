import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  COMMENTS,
  CURRENT_USER,
  NOTIFICATIONS,
  PEOPLE,
  SOCIETIES,
  VOTINGS,
} from '../data/mockData.js'
import * as api from '../lib/api.js'
import * as auth from '../lib/auth.js'

const AppContext = createContext(null)

const STORAGE_KEY = 'democratia.state.v1'

// Τρέχουσα έκδοση όρων/πολιτικής (συμβαδίζει με τον server: POLICY_VERSION).
export const POLICY_VERSION = '2025-06-01'

// Φόρτωση αποθηκευμένης κατάστασης (ώστε οι ψήφοι/σχόλια να παραμένουν μετά από refresh)
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const defaultSettings = {
  notifNewVoting: true,
  notifResults: true,
  notifLikes: true,
  newsletter: false,
}

// Αρχικά δεδομένα από τα mock — αντικαθίστανται από το API (αν είναι ενεργό).
const MOCK_DATA = {
  societies: SOCIETIES,
  votings: VOTINGS,
  comments: COMMENTS,
  people: PEOPLE,
  notifications: NOTIFICATIONS,
}

export function AppProvider({ children }) {
  const saved = loadState()

  // Συνεδρία: { token, account: { id, fullName, ageVerified } } ή null.
  const [session, setSession] = useState(saved?.session ?? null)
  const isAuthenticated = !!session
  // Έκδοση όρων που έχει αποδεχθεί ο χρήστης (για GDPR consent gate).
  const [consentVersion, setConsentVersion] = useState(saved?.consentVersion ?? null)
  const [activeSociety, setActiveSociety] = useState(saved?.activeSociety ?? SOCIETIES[0].id)

  // Πηγή δεδομένων: ξεκινά με mock, αντικαθίσταται από το API αν οριστεί VITE_API_URL.
  const [data, setData] = useState(MOCK_DATA)
  const [dataSource, setDataSource] = useState(api.isApiEnabled() ? 'loading' : 'mock')

  // ψήφοι: { [votingId]: 'yes' | 'no' | 'present' }
  const [votes, setVotes] = useState(saved?.votes ?? {})
  // σχόλια χρήστη: { [votingId]: { text, createdAt, deletedOnce } }
  const [userComments, setUserComments] = useState(saved?.userComments ?? {})
  // likes σε σχόλια άλλων: string[] (comment ids)
  const [likedComments, setLikedComments] = useState(saved?.likedComments ?? [])
  // ακολουθούμενοι χρήστες: string[] (user ids)
  const [following, setFollowing] = useState(saved?.following ?? [])
  const [settings, setSettings] = useState(saved?.settings ?? defaultSettings)

  // Αν είναι ενεργό το backend, φόρτωσε όλα τα δεδομένα από το /api/bootstrap.
  // Σε αποτυχία, παραμένουν τα mock δεδομένα (graceful fallback).
  useEffect(() => {
    if (!api.isApiEnabled()) return
    let cancelled = false
    api
      .fetchBootstrap()
      .then((payload) => {
        if (cancelled) return
        setData({
          societies: payload.societies?.length ? payload.societies : SOCIETIES,
          votings: payload.votings ?? [],
          comments: payload.comments ?? {},
          people: payload.people ?? PEOPLE,
          notifications: payload.notifications ?? [],
        })
        setDataSource('api')
      })
      .catch((err) => {
        console.warn('[Democratia] Αποτυχία σύνδεσης με το API — χρήση mock δεδομένων.', err)
        if (!cancelled) setDataSource('mock')
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Αποθήκευση κατάστασης σε κάθε αλλαγή
  useEffect(() => {
    const state = {
      session,
      consentVersion,
      activeSociety,
      votes,
      userComments,
      likedComments,
      following,
      settings,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [session, consentVersion, activeSociety, votes, userComments, likedComments, following, settings])

  // ── Ενέργειες ────────────────────────────────────────────────────────────
  // Ολοκλήρωση πραγματικής σύνδεσης (μετά Taxisnet + OTP).
  function completeLogin(token, account) {
    setSession({ token, account })
  }

  // Γρήγορη σύνδεση επίδειξης (για τις οθόνες προσομοίωσης εγγραφής).
  function login() {
    const demo = auth.DUMMY_CITIZENS[0]
    setSession({ token: 'sim-' + demo.afm, account: { id: 'sim-' + demo.afm, fullName: demo.fullName, ageVerified: true } })
  }

  function logout() {
    auth.logout(session?.token)
    setSession(null)
  }

  // Αποδοχή όρων/πολιτικής (GDPR). Καταγράφεται και στον server (αν είναι ενεργός).
  function acceptConsent() {
    setConsentVersion(POLICY_VERSION)
    auth.recordConsent('terms', true, session?.token)
    auth.recordConsent('privacy', true, session?.token)
  }
  const hasConsented = consentVersion === POLICY_VERSION

  // GDPR: εξαγωγή & διαγραφή δεδομένων.
  function exportMyData() {
    return auth.exportData(session?.token, session?.account)
  }
  async function deleteMyAccount() {
    await auth.deleteAccount(session?.token)
    // Καθαρισμός τοπικών δεδομένων
    setSession(null)
    setVotes({})
    setUserComments({})
    setLikedComments([])
    setFollowing([])
  }

  // Η ψήφος είναι αμετάκλητη: αν υπάρχει ήδη, δεν αλλάζει.
  // Με ενεργό backend, στέλνεται ανώνυμα στο API· σε σφάλμα «κλειστού» ψηφίσματος
  // δεν καταγράφεται τοπικά.
  function castVote(votingId, choice) {
    if (votes[votingId]) return
    // Όταν είναι συνδεδεμένος, η ψήφος δένεται με τον λογαριασμό (μία ανά πολίτη)·
    // αλλιώς με ανώνυμο token συσκευής. Σε καμία περίπτωση δεν αποθηκεύεται PII.
    const voterToken = session?.account?.id ?? api.getVoterToken()
    if (api.isApiEnabled()) {
      api
        .castVote(votingId, choice, voterToken)
        .then(() => setVotes((prev) => (prev[votingId] ? prev : { ...prev, [votingId]: choice })))
        .catch((err) => {
          const msg = String(err?.message ?? '')
          if (msg.includes('already_voted')) {
            // Είχε ήδη ψηφίσει (π.χ. από άλλη συσκευή) — αποτύπωσέ το τοπικά.
            setVotes((prev) => (prev[votingId] ? prev : { ...prev, [votingId]: choice }))
          } else {
            console.warn('[Democratia] Η ψήφος δεν καταχωρήθηκε:', msg)
          }
        })
      return
    }
    setVotes((prev) => (prev[votingId] ? prev : { ...prev, [votingId]: choice }))
  }

  // Ένα σχόλιο ανά ψήφισμα, έως 1000 χαρακτήρες.
  function addComment(votingId, text) {
    const clean = text.trim().slice(0, 1000)
    if (!clean) return
    setUserComments((prev) => {
      const existing = prev[votingId]
      // Αν ο χρήστης έχει ήδη διαγράψει σχόλιο σε αυτό το ψήφισμα, δεν επιτρέπεται νέο.
      if (existing?.deletedOnce) return prev
      if (existing && !existing.deleted) return prev
      return {
        ...prev,
        [votingId]: { text: clean, createdAt: new Date().toISOString().slice(0, 10), deleted: false },
      }
    })
  }

  // Διαγραφή σχολίου — μετά τη διαγραφή ΔΕΝ επιτρέπεται νέο σχόλιο στο ίδιο ψήφισμα.
  function deleteComment(votingId) {
    setUserComments((prev) => {
      if (!prev[votingId]) return prev
      return { ...prev, [votingId]: { ...prev[votingId], deleted: true, deletedOnce: true } }
    })
  }

  // Like σε σχόλιο άλλου (μία φορά, όχι στα δικά μας).
  function toggleLike(commentId) {
    setLikedComments((prev) =>
      prev.includes(commentId) ? prev.filter((id) => id !== commentId) : [...prev, commentId],
    )
  }

  function toggleFollow(userId) {
    if (userId === CURRENT_USER.id) return
    setFollowing((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }

  function updateSetting(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  // ── Παράγωγα δεδομένα ──────────────────────────────────────────────────────
  const votingsForSociety = useMemo(
    () => data.votings.filter((v) => v.society === activeSociety),
    [data.votings, activeSociety],
  )

  // Εύρεση ψηφίσματος με βάση το id (από την τρέχουσα πηγή δεδομένων).
  function getVoting(id) {
    return data.votings.find((v) => v.id === id)
  }

  // Συγκεντρωτικά σχόλια ανά ψήφισμα (βάση + σχόλιο χρήστη)
  function getComments(votingId) {
    const base = data.comments[votingId] ? [...data.comments[votingId]] : []
    const mine = userComments[votingId]
    if (mine && !mine.deleted) {
      base.unshift({
        id: `mine-${votingId}`,
        authorId: CURRENT_USER.id,
        text: mine.text,
        createdAt: mine.createdAt,
        likes: 0,
        isMine: true,
      })
    }
    return base
  }

  // Ιστορικό: ψηφίσματα που ο χρήστης ψήφισε ή σχολίασε
  const history = useMemo(() => {
    return data.votings
      .filter((v) => votes[v.id] || (userComments[v.id] && !userComments[v.id].deleted))
      .map((v) => {
        const didVote = !!votes[v.id]
        const didComment = !!(userComments[v.id] && !userComments[v.id].deleted)
        let action = 'Συμμετοχή'
        if (didVote && didComment) action = 'Ψήφος & Σχόλιο'
        else if (didVote) action = 'Ψήφος'
        else if (didComment) action = 'Σχόλιο'
        return { voting: v, action, date: userComments[v.id]?.createdAt || v.uploadedAt }
      })
  }, [data.votings, votes, userComments])

  // Ταυτότητα τρέχοντος χρήστη: από τη συνεδρία όταν είναι συνδεδεμένος.
  const currentUser = session?.account
    ? { id: session.account.id, fullName: session.account.fullName, username: 'πολίτης', role: 'Citizen' }
    : CURRENT_USER

  const value = {
    // κατάσταση
    isAuthenticated,
    session,
    hasConsented,
    consentVersion,
    activeSociety,
    societies: data.societies,
    votes,
    userComments,
    likedComments,
    following,
    settings,
    people: data.people,
    currentUser,
    notifications: data.notifications,
    votingsForSociety,
    history,
    dataSource, // 'mock' | 'loading' | 'api'
    // ενέργειες
    login,
    completeLogin,
    logout,
    acceptConsent,
    exportMyData,
    deleteMyAccount,
    setActiveSociety,
    castVote,
    addComment,
    deleteComment,
    toggleLike,
    toggleFollow,
    updateSetting,
    getComments,
    getVoting,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
