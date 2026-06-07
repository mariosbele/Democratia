import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  COMMENTS,
  CURRENT_USER,
  NOTIFICATIONS,
  PEOPLE,
  SOCIETIES,
  VOTINGS,
} from '../data/mockData.js'

const AppContext = createContext(null)

const STORAGE_KEY = 'democratia.state.v1'

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

export function AppProvider({ children }) {
  const saved = loadState()

  const [isAuthenticated, setIsAuthenticated] = useState(saved?.isAuthenticated ?? false)
  const [activeSociety, setActiveSociety] = useState(saved?.activeSociety ?? SOCIETIES[0].id)

  // ψήφοι: { [votingId]: 'yes' | 'no' | 'present' }
  const [votes, setVotes] = useState(saved?.votes ?? {})
  // σχόλια χρήστη: { [votingId]: { text, createdAt, deletedOnce } }
  const [userComments, setUserComments] = useState(saved?.userComments ?? {})
  // likes σε σχόλια άλλων: string[] (comment ids)
  const [likedComments, setLikedComments] = useState(saved?.likedComments ?? [])
  // ακολουθούμενοι χρήστες: string[] (user ids)
  const [following, setFollowing] = useState(saved?.following ?? [])
  const [settings, setSettings] = useState(saved?.settings ?? defaultSettings)

  // Αποθήκευση κατάστασης σε κάθε αλλαγή
  useEffect(() => {
    const state = {
      isAuthenticated,
      activeSociety,
      votes,
      userComments,
      likedComments,
      following,
      settings,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [isAuthenticated, activeSociety, votes, userComments, likedComments, following, settings])

  // ── Ενέργειες ────────────────────────────────────────────────────────────
  function login() {
    setIsAuthenticated(true)
  }

  function logout() {
    setIsAuthenticated(false)
  }

  // Η ψήφος είναι αμετάκλητη: αν υπάρχει ήδη, δεν αλλάζει.
  function castVote(votingId, choice) {
    setVotes((prev) => {
      if (prev[votingId]) return prev
      return { ...prev, [votingId]: choice }
    })
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
    () => VOTINGS.filter((v) => v.society === activeSociety),
    [activeSociety],
  )

  // Συγκεντρωτικά σχόλια ανά ψήφισμα (mock + σχόλιο χρήστη)
  function getComments(votingId) {
    const base = COMMENTS[votingId] ? [...COMMENTS[votingId]] : []
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
    return VOTINGS.filter((v) => votes[v.id] || (userComments[v.id] && !userComments[v.id].deleted)).map(
      (v) => {
        const didVote = !!votes[v.id]
        const didComment = !!(userComments[v.id] && !userComments[v.id].deleted)
        let action = 'Συμμετοχή'
        if (didVote && didComment) action = 'Ψήφος & Σχόλιο'
        else if (didVote) action = 'Ψήφος'
        else if (didComment) action = 'Σχόλιο'
        return { voting: v, action, date: userComments[v.id]?.createdAt || v.uploadedAt }
      },
    )
  }, [votes, userComments])

  const value = {
    // κατάσταση
    isAuthenticated,
    activeSociety,
    societies: SOCIETIES,
    votes,
    userComments,
    likedComments,
    following,
    settings,
    people: PEOPLE,
    currentUser: CURRENT_USER,
    notifications: NOTIFICATIONS,
    votingsForSociety,
    history,
    // ενέργειες
    login,
    logout,
    setActiveSociety,
    castVote,
    addComment,
    deleteComment,
    toggleLike,
    toggleFollow,
    updateSetting,
    getComments,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
