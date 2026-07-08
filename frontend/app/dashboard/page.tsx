'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, RoleBadge, EmptyState } from '../components/ui'

type Workspace = {
  id: number
  name: string
  slug: string
  role: string
}

export default function Dashboard() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [newName, setNewName] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [userName, setUserName] = useState('')
  const router = useRouter()

  async function loadWorkspaces() {
    const token = localStorage.getItem('token')

    const res = await fetch('http://localhost:8000/workspaces/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (res.ok) {
      setWorkspaces(await res.json())
    }
  }

  useEffect(() => {
    setUserName(localStorage.getItem('userName') || '')
    loadWorkspaces()
  }, [])

  async function createWorkspace(e: React.FormEvent) {
    e.preventDefault()

    const token = localStorage.getItem('token')

    await fetch('http://localhost:8000/workspaces/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: newName,
      }),
    })

    setNewName('')
    setShowForm(false)
    loadWorkspaces()
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('userName')
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* TOPBAR */}
      <div className="border-b border-line bg-surface">
        <div className="max-w-5xl mx-auto px-8 py-4 flex items-center justify-between">
          <span className="font-display text-lg text-foreground">DocuFlow</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted hidden sm:inline">{userName}</span>
            <button onClick={logout} className="text-xs text-muted hover:text-danger transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-foreground">
              Your workspaces
            </h1>
            <p className="text-sm text-muted mt-1">Every company you belong to, in one place</p>
          </div>
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Cancel' : '+ New workspace'}
          </Button>
        </div>

        {showForm && (
          <form
            onSubmit={createWorkspace}
            className="paper-stack mb-8 flex gap-3 items-end rounded-xl border border-line bg-surface p-5"
          >
            <div className="flex-1">
              <label className="block text-xs font-medium text-muted mb-1.5">Workspace name</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Acme Legal"
                className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand/30 focus:border-brand focus:outline-none"
                required
                autoFocus
              />
            </div>
            <Button type="submit">Create</Button>
          </form>
        )}

        {workspaces.length === 0 ? (
          <div className="paper-stack rounded-xl border border-line bg-surface">
            <EmptyState
              icon="🗂️"
              title="No workspaces yet"
              subtitle="Create your first one to start uploading and sharing documents."
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                onClick={() => router.push(`/workspace/${ws.id}`)}
                className="paper-stack cursor-pointer rounded-xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-sm font-semibold text-brand">
                    {ws.name[0]?.toUpperCase()}
                  </div>
                  <RoleBadge role={ws.role} />
                </div>
                <p className="text-sm font-semibold text-foreground">{ws.name}</p>
                <p className="mt-0.5 font-mono text-xs text-muted">{ws.slug}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}