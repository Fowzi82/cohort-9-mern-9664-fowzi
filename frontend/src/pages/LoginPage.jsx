import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, NotebookPen, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import { useAuth } from '../context/AuthContext'

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0a] px-6 py-12 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(44,116,255,0.18),transparent_34%),radial-gradient(circle_at_90%_80%,rgba(0,211,178,0.12),transparent_30%)]" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/50 backdrop-blur-2xl md:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden flex-col justify-between border-r border-white/10 p-10 md:flex lg:p-14">
          <div className="flex items-center gap-3 text-sm font-semibold tracking-wide text-white/80"><span className="grid size-9 place-items-center rounded-xl bg-cyan-300 text-slate-950"><NotebookPen size={19} /></span> Lumen Notes</div>
          <div><Sparkles className="mb-8 text-cyan-300" size={28} /><h1 className="max-w-sm text-4xl font-semibold leading-tight tracking-[-0.04em] lg:text-5xl">Your sharpest thinking, in one place.</h1><p className="mt-5 max-w-sm text-sm leading-6 text-white/45">Capture the decisions, ideas, and details that move your team forward.</p></div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/25">Private by design · Built for focus</p>
        </section>

        <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: 'easeOut' }} className="p-7 sm:p-10 lg:p-14">
          <div className="mb-10 md:hidden"><div className="mb-8 flex items-center gap-3 text-sm font-semibold tracking-wide text-white/80"><span className="grid size-9 place-items-center rounded-xl bg-cyan-300 text-slate-950"><NotebookPen size={19} /></span> Lumen Notes</div><p className="text-3xl font-semibold tracking-[-0.04em]">Welcome back.</p></div>
          <div className="mb-9 hidden md:block"><p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-cyan-300">Workspace access</p><h2 className="text-3xl font-semibold tracking-[-0.04em]">Welcome back.</h2><p className="mt-3 text-sm text-white/45">Sign in to pick up where you left off.</p></div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block text-sm text-white/60">Email<div className="group mt-2 flex items-center rounded-xl border border-white/10 bg-black/20 px-3 transition focus-within:border-cyan-300/60 focus-within:bg-white/[0.06] focus-within:ring-4 focus-within:ring-cyan-300/10"><Mail size={18} className="text-white/30 transition group-focus-within:text-cyan-300" /><input required type="email" name="email" value={form.email} onChange={updateField} placeholder="you@company.com" className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-white/25" /></div></label>
            <label className="block text-sm text-white/60">Password<div className="group mt-2 flex items-center rounded-xl border border-white/10 bg-black/20 px-3 transition focus-within:border-cyan-300/60 focus-within:bg-white/[0.06] focus-within:ring-4 focus-within:ring-cyan-300/10"><LockKeyhole size={18} className="text-white/30 transition group-focus-within:text-cyan-300" /><input required type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={updateField} placeholder="Enter your password" className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-white/25" /><button type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword(!showPassword)} className="text-white/30 transition hover:text-white/70">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
            {error && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">{error}</p>}
            <motion.button whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-300/10 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60">{loading ? 'Signing in...' : <>Sign In <ArrowRight size={17} /></>}</motion.button>
          </form>
          <p className="mt-8 text-center text-sm text-white/40">New to Lumen? <Link to="/register" className="font-medium text-cyan-300 transition hover:text-cyan-200">Create an account</Link></p>
        </motion.section>
      </div>
    </main>
  )
}

export default LoginPage