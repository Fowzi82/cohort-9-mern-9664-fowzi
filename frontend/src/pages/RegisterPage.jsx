import { motion } from 'framer-motion'
import { ArrowRight, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import api from '../lib/axios'

function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/api/auth/register', form)
      toast.success('Account created. Please sign in.')
      navigate('/login')
    } catch (requestError) {
      const message = requestError.response?.data?.error || 'Unable to create your account. Please try again.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12 text-white">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="relative w-full max-w-md rounded-[32px] border border-white/10 bg-white/[0.045] p-7 shadow-[0_30px_90px_rgba(2,6,23,0.5)] backdrop-blur-2xl sm:p-10"
      >
        <div className="mb-10 flex items-center text-sm font-semibold tracking-[0.12em] uppercase text-white/90">
          <span className="text-white font-bold">Khayaal</span>
          <span className="mx-3 h-4 w-px bg-white/25" aria-hidden="true" />
          <span className="wordmark-urdu gradient-text pb-2 leading-loose text-base">خیال</span>
        </div>

        <div className="mb-8">
          <p className="mb-3 text-[0.68rem] font-medium uppercase tracking-[0.2em] text-indigo-300">Start capturing</p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Make space for good ideas.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">Create your workspace and bring your thinking together.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block space-y-2 text-sm text-white/60">
            <span>Username</span>
            <div className="relative">
              <UserRound size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
              <Input
                required
                name="username"
                value={form.username}
                onChange={updateField}
                placeholder="Your name"
                className="h-12 border-[#1e1e2e] bg-[#111118] pl-10 text-white placeholder:text-slate-500 focus-visible:border-indigo-400/80 focus-visible:ring-indigo-400/20"
              />
            </div>
          </label>

          <label className="block space-y-2 text-sm text-white/60">
            <span>Email</span>
            <div className="relative">
              <Mail size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
              <Input
                required
                type="email"
                name="email"
                value={form.email}
                onChange={updateField}
                placeholder="you@company.com"
                className="h-12 border-[#1e1e2e] bg-[#111118] pl-10 text-white placeholder:text-slate-500 focus-visible:border-indigo-400/80 focus-visible:ring-indigo-400/20"
              />
            </div>
          </label>

          <label className="block space-y-2 text-sm text-white/60">
            <span>Password</span>
            <div className="relative">
              <LockKeyhole size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
              <Input
                required
                type="password"
                name="password"
                value={form.password}
                onChange={updateField}
                placeholder="Create a password"
                className="h-12 border-[#1e1e2e] bg-[#111118] pl-10 text-white placeholder:text-slate-500 focus-visible:border-indigo-400/80 focus-visible:ring-indigo-400/20"
              />
            </div>
          </label>

          {error && (
            <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}

          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:brightness-110 disabled:pointer-events-none disabled:opacity-60"
            >
              {loading ? 'Creating account...' : <>Create Account <ArrowRight size={17} /></>}
            </Button>
          </motion.div>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-300 transition hover:text-indigo-200">
            Sign in
          </Link>
        </p>
      </motion.section>
    </main>
  )
}

export default RegisterPage
