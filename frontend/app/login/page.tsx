'use client' // tells Next.js this page uses browser features

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../components/ui'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Call your FastAPI backend /auth/login endpoint
    const res = await fetch('http://localhost:8000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    })

    if (res.ok) {
      const data = await res.json()

      localStorage.setItem('token', data.access_token) // save JWT token
      localStorage.setItem('userName', data.user_name)

      router.push('/dashboard') // redirect (built in Week 2)
    } else {
      setError('Wrong email or password. Please try again.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* LEFT — brand panel, hidden on small screens */}
      <div className="hidden lg:flex lg:w-5/12 bg-brand relative flex-col justify-between p-12 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, #fff 0px, #fff 1px, transparent 1px, transparent 22px)',
          }}
        />
        <div className="relative text-white/90 text-sm font-medium tracking-wide">
          DOCUFLOW
        </div>

        <div className="relative">
          <h1 className="font-display text-white text-4xl leading-tight mb-4">
            Every document,<br />in its right place.
          </h1>
          <p className="text-white/70 text-sm max-w-sm leading-relaxed">
            Shared workspaces, role-based access, and a single search across
            everything your team has ever uploaded.
          </p>
        </div>

        <div className="relative flex gap-6 text-white/60 text-xs font-mono">
          <span>256-bit encryption</span>
          <span>·</span>
          <span>Role-based access</span>
        </div>
      </div>

      {/* RIGHT — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl text-foreground mb-1">
            Welcome back
          </h1>

          <p className="text-muted text-sm mb-8">
            Sign in to your workspace
          </p>

          {error && (
            <div className="bg-danger-bg border border-danger/20 text-danger px-4 py-3 rounded-lg mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                Email
              </label>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-line bg-surface rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-brand/30 focus:border-brand focus:outline-none transition-shadow"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-line bg-surface rounded-lg px-3.5 py-2.5 pr-16 text-sm text-foreground focus:ring-2 focus:ring-brand/30 focus:border-brand focus:outline-none transition-shadow"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-foreground"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
