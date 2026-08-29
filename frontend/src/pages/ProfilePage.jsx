import { motion } from 'framer-motion'
import { ArrowLeft, Camera, KeyRound, LoaderCircle, LogOut, Save, UserRound } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { useAuth } from '../context/AuthContext'
import api from '../lib/axios'
import { getAvatarDisplayName, getInitials, getProfileCreatedAt, getStoredProfile, saveStoredProfile } from '../lib/profile'

function formatDate(value) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Unable to read image'))
    reader.readAsDataURL(file)
  })
}

function ProfilePage() {
  const navigate = useNavigate()
  const { user, login, logout } = useAuth()
  const fileInputRef = useRef(null)
  const [profile, setProfile] = useState(() => getStoredProfile())
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [notesCount, setNotesCount] = useState(0)
  const [loadingNotes, setLoadingNotes] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingUsername, setSavingUsername] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  const fullName = useMemo(() => getAvatarDisplayName(user, profile), [profile, user])
  const initials = useMemo(() => getInitials(fullName), [fullName])
  const createdAt = useMemo(() => getProfileCreatedAt(user, profile), [profile, user])

  useEffect(() => {
    setDisplayName(profile.displayName || user?.username || '')
  }, [profile.displayName, user?.username])

  useEffect(() => {
    setUsername(user?.username || '')
  }, [user?.username])

  useEffect(() => {
    if (!profile.createdAt) {
      const next = saveStoredProfile({ createdAt })
      setProfile(next)
    }
  }, [createdAt, profile.createdAt])

  useEffect(() => {
    async function loadNotesCount() {
      try {
        const response = await api.get('/api/notes')
        setNotesCount(Array.isArray(response.data) ? response.data.length : 0)
      } catch {
        setNotesCount(0)
      } finally {
        setLoadingNotes(false)
      }
    }

    loadNotesCount()
  }, [])

  async function handleAvatarPick(event) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.')
      return
    }

    try {
      const base64 = await readFileAsDataUrl(file)
      const next = saveStoredProfile({ avatar: base64 })
      setProfile(next)
      toast.success('Avatar updated.')
    } catch {
      toast.error('Unable to set avatar image.')
    }
  }

  function requestLogout() {
    setLogoutDialogOpen(true)
  }

  function confirmLogout() {
    setLogoutDialogOpen(false)
    logout()
    navigate('/login')
  }

  function handleSaveProfile() {
    const trimmed = displayName.trim()
    if (!trimmed) {
      toast.error('Display name cannot be empty.')
      return
    }

    setSaving(true)
    const next = saveStoredProfile({ displayName: trimmed })
    setProfile(next)
    toast.success('Profile saved.')
    setSaving(false)
  }

  async function handleSaveUsername() {
    const trimmed = username.trim()
    if (!trimmed) {
      toast.error('Username cannot be empty.')
      return
    }

    setSavingUsername(true)
    try {
      const response = await api.put('/api/auth/update-profile', { username: trimmed })
      if (response.data?.token && login) {
        login(response.data.token)
      }
      toast.success('Username updated.')
    } catch (requestError) {
      const message = requestError.response?.data?.error || 'Unable to update username.'
      toast.error(message)
    } finally {
      setSavingUsername(false)
    }
  }

  async function handleChangePassword() {
    const currentPassword = passwordForm.currentPassword
    const newPassword = passwordForm.newPassword
    const confirmPassword = passwordForm.confirmPassword

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      toast.error('Fill in all password fields.')
      return
    }

    if (!newPassword.trim()) {
      toast.error('New password cannot be empty.')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    setSavingPassword(true)
    try {
      await api.put('/api/auth/change-password', { currentPassword, newPassword })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast.success('Password updated.')
    } catch (requestError) {
      const message = requestError.response?.data?.error || 'Unable to update password.'
      toast.error(message)
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <main className="dashboard-shell relative min-h-screen overflow-hidden px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="dashboard-grid" />

      <div className="relative mx-auto w-full max-w-4xl">
        <div className="mb-8 flex items-center justify-between gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>
          <div className="flex items-center text-sm font-semibold tracking-[0.12em] uppercase text-white/90">
            <span className="font-bold text-white">Khayaal</span>
            <span className="mx-3 h-4 w-px bg-white/25" aria-hidden="true" />
            <span className="wordmark-urdu gradient-text pb-2 leading-loose text-base">خیال</span>
          </div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-[30px] border border-[#1e1e2e] bg-white/[0.05] p-5 shadow-[0_30px_80px_rgba(10,10,15,0.65)] backdrop-blur-2xl sm:p-8"
        >
          <div className="flex flex-col gap-7 md:flex-row md:items-start md:justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative grid h-24 w-24 place-items-center overflow-hidden rounded-full border border-indigo-400/40 bg-gradient-to-br from-indigo-500/30 to-purple-600/30 text-xl font-semibold text-white"
                aria-label="Change avatar"
              >
                {profile.avatar ? (
                  <img src={profile.avatar} alt="Profile avatar" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
                <span className="absolute inset-0 grid place-items-center bg-black/55 text-white opacity-0 transition group-hover:opacity-100">
                  <Camera size={18} />
                </span>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarPick} className="hidden" />

              <div>
                <p className="text-[0.7rem] uppercase tracking-[0.2em] text-indigo-300">Your profile</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-white">{fullName}</h1>
                <p className="mt-1 text-sm text-slate-400">{user?.email || 'No email available'}</p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={requestLogout}
              className="border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/[0.09] hover:text-white"
            >
              <LogOut size={16} />
              Logout
            </Button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Username</p>
              <p className="mt-2 text-sm text-white">{user?.username || 'Not set'}</p>
            </article>
            <article className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Email</p>
              <p className="mt-2 text-sm text-white break-all">{user?.email || 'Not set'}</p>
            </article>
            <article className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Joined</p>
              <p className="mt-2 text-sm text-white">{formatDate(createdAt)}</p>
            </article>
            <article className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Total notes</p>
              <p className="mt-2 text-sm text-white">{loadingNotes ? 'Loading...' : notesCount}</p>
            </article>
          </div>

          <div className="mt-8 rounded-2xl border border-[#1e1e2e] bg-[#111118] p-4 sm:p-5">
            <p className="mb-3 flex items-center gap-2 text-sm text-slate-300">
              <UserRound size={16} /> Display name
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="h-11 border-[#1e1e2e] bg-[#0f0f16] text-white placeholder:text-slate-500 focus-visible:border-indigo-400/80 focus-visible:ring-indigo-500/20"
                placeholder="Your display name"
              />
              <Button
                type="button"
                disabled={saving}
                onClick={handleSaveProfile}
                className="h-11 bg-gradient-to-r from-indigo-500 to-purple-600 font-semibold text-white hover:brightness-110"
              >
                {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[#1e1e2e] bg-[#111118] p-4 sm:p-5">
            <p className="mb-3 flex items-center gap-2 text-sm text-slate-300">
              <UserRound size={16} /> Username
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                className="h-11 border-[#1e1e2e] bg-[#0f0f16] text-white placeholder:text-slate-500 focus-visible:border-indigo-400/80 focus-visible:ring-indigo-500/20"
                placeholder="Your username"
              />
              <Button
                type="button"
                disabled={savingUsername}
                onClick={handleSaveUsername}
                className="h-11 bg-gradient-to-r from-indigo-500 to-purple-600 font-semibold text-white hover:brightness-110"
              >
                {savingUsername ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
                {savingUsername ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[#1e1e2e] bg-[#111118] p-4 sm:p-5">
            <p className="mb-3 flex items-center gap-2 text-sm text-slate-300">
              <KeyRound size={16} /> Change password
            </p>
            <div className="grid gap-3">
              <Input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                autoComplete="current-password"
                className="h-11 border-[#1e1e2e] bg-[#0f0f16] text-white placeholder:text-slate-500 focus-visible:border-indigo-400/80 focus-visible:ring-indigo-500/20"
                placeholder="Current Password"
              />
              <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                  autoComplete="new-password"
                  className="h-11 border-[#1e1e2e] bg-[#0f0f16] text-white placeholder:text-slate-500 focus-visible:border-indigo-400/80 focus-visible:ring-indigo-500/20"
                  placeholder="New Password"
                />
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                  autoComplete="new-password"
                  className="h-11 border-[#1e1e2e] bg-[#0f0f16] text-white placeholder:text-slate-500 focus-visible:border-indigo-400/80 focus-visible:ring-indigo-500/20"
                  placeholder="Confirm Password"
                />
                <Button
                  type="button"
                  disabled={
                    savingPassword ||
                    !passwordForm.currentPassword ||
                    !passwordForm.newPassword ||
                    !passwordForm.confirmPassword
                  }
                  onClick={handleChangePassword}
                  className="h-11 bg-gradient-to-r from-indigo-500 to-purple-600 font-semibold text-white hover:brightness-110 disabled:pointer-events-none disabled:opacity-60"
                >
                  {savingPassword ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
                  {savingPassword ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="border border-[#1e1e2e] bg-[#111118]/95 p-0 text-white shadow-[0_30px_80px_rgba(10,10,15,0.8)] backdrop-blur-xl sm:max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="p-6"
          >
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="text-xl font-semibold text-white">Sign out of Khayaal?</DialogTitle>
              <DialogDescription className="text-sm text-slate-300">You can always sign back in.</DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-6 flex-row justify-end border-t border-[#1e1e2e] pt-4">
              <Button type="button" variant="ghost" onClick={() => setLogoutDialogOpen(false)} className="text-slate-300 hover:bg-white/[0.04] hover:text-white">
                Cancel
              </Button>
              <Button type="button" onClick={confirmLogout} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:brightness-110">
                Sign out
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>
    </main>
  )
}

export default ProfilePage
