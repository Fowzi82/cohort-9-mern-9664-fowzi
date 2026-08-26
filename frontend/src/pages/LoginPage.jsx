import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAuth } from '../context/AuthContext'
import api from '../lib/axios'

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
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
      const response = await api.post('/api/auth/login', form)
      login(response.data.token || response.data)
      navigate('/dashboard')
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to sign in. Please check your details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12 text-white">
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] shadow-[0_30px_90px_rgba(2,6,23,0.5)] backdrop-blur-2xl md:grid-cols-[1.08fr_0.92fr]">
        <section className="hidden flex-col justify-between border-r border-[#1e1e2e] bg-[#0f0f16]/80 p-10 md:flex lg:p-14">
          <div className="flex items-center text-sm font-semibold tracking-[0.12em] uppercase text-white/90">
            <span className="text-white font-bold">Lumen</span>
            <span className="gradient-text ml-2">Notes</span>
          </div>

          <div>
            <Sparkles className="mb-8 text-indigo-400" size={28} />
            <h1 className="max-w-sm text-4xl font-semibold leading-tight tracking-[-0.05em] lg:text-5xl">
              Your sharpest thinking, in one place.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">
              Capture the decisions, ideas, and details that move your team forward.
            </p>
          </div>

          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-slate-500">Private by design · Built for focus</p>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="p-7 sm:p-10 lg:p-14"
        >
          <div className="mb-10 md:hidden">
            <div className="mb-8 flex items-center text-sm font-semibold tracking-[0.12em] uppercase text-white/90">
              <span className="text-white font-bold">Lumen</span>
              <span className="gradient-text ml-2">Notes</span>
            </div>
            <p className="text-3xl font-semibold tracking-[-0.04em]">Welcome back.</p>
          </div>

          <div className="mb-9 hidden md:block">
            <p className="mb-3 text-[0.68rem] font-medium uppercase tracking-[0.2em] text-indigo-300">Workspace access</p>
            <h2 className="text-3xl font-semibold tracking-[-0.04em]">Welcome back.</h2>
            <p className="mt-3 text-sm text-slate-400">Sign in to pick up where you left off.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={updateField}
                  placeholder="Enter your password"
                  className="h-12 border-[#1e1e2e] bg-[#111118] pl-10 pr-11 text-white placeholder:text-slate-500 focus-visible:border-indigo-400/80 focus-visible:ring-indigo-400/20"
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword((currentValue) => !currentValue)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white/70"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
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
                {loading ? 'Signing in...' : <>Sign In <ArrowRight size={17} /></>}
              </Button>
            </motion.div>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            New to Lumen?{' '}
            <Link to="/register" className="font-medium text-indigo-300 transition hover:text-indigo-200">
              Create an account
            </Link>
          </p>
        </motion.section>
      </div>
    </main>
  )
}

export default LoginPage
