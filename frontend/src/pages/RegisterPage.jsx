import { motion } from 'framer-motion'
import { ArrowRight, LockKeyhole, Mail, NotebookPen, Sparkles, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
      navigate('/login')
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to create your account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0a] px-6 py-12 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(0,211,178,0.16),transparent_34%),radial-gradient(circle_at_15%_85%,rgba(44,116,255,0.13),transparent_32%)]" />
      <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: 'easeOut' }} className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.045] p-7 shadow-2xl shadow-black/50 backdrop-blur-2xl sm:p-10">
        <div className="mb-10 flex items-center gap-3 text-sm font-semibold tracking-wide text-white/80"><span className="grid size-9 place-items-center rounded-xl bg-cyan-300 text-slate-950"><NotebookPen size={19} /></span> Lumen Notes</div>
        <div className="mb-8"><Sparkles className="mb-5 text-cyan-300" size={25} /><p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-cyan-300">Start capturing</p><h1 className="text-3xl font-semibold tracking-[-0.04em]">Make space for good ideas.</h1><p className="mt-3 text-sm leading-6 text-white/45">Create your workspace and bring your thinking together.</p></div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-sm text-white/60">Username<div className="group mt-2 flex items-center rounded-xl border border-white/10 bg-black/20 px-3 transition focus-within:border-cyan-300/60 focus-within:bg-white/[0.06] focus-within:ring-4 focus-within:ring-cyan-300/10"><UserRound size={18} className="text-white/30 transition group-focus-within:text-cyan-300" /><input required name="username" value={form.username} onChange={updateField} placeholder="Your name" className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-white/25" /></div></label>
          <label className="block text-sm text-white/60">Email<div className="group mt-2 flex items-center rounded-xl border border-white/10 bg-black/20 px-3 transition focus-within:border-cyan-300/60 focus-within:bg-white/[0.06] focus-within:ring-4 focus-within:ring-cyan-300/10"><Mail size={18} className="text-white/30 transition group-focus-within:text-cyan-300" /><input required type="email" name="email" value={form.email} onChange={updateField} placeholder="you@company.com" className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-white/25" /></div></label>
          <label className="block text-sm text-white/60">Password<div className="group mt-2 flex items-center rounded-xl border border-white/10 bg-black/20 px-3 transition focus-within:border-cyan-300/60 focus-within:bg-white/[0.06] focus-within:ring-4 focus-within:ring-cyan-300/10"><LockKeyhole size={18} className="text-white/30 transition group-focus-within:text-cyan-300" /><input required type="password" name="password" value={form.password} onChange={updateField} placeholder="Create a password" className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-white/25" /></div></label>
          {error && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">{error}</p>}
          <motion.button whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-300/10 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60">{loading ? 'Creating account...' : <>Create Account <ArrowRight size={17} /></>}</motion.button>
        </form>
        <p className="mt-8 text-center text-sm text-white/40">Already have an account? <Link to="/login" className="font-medium text-cyan-300 transition hover:text-cyan-200">Sign in</Link></p>
      </motion.section>
    </main>
  )
}

export default RegisterPage