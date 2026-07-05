'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Workspace = {
  id: number
  name: string
  slug: string
  role: string
}

export default function Dashboard() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [newName, setNewName] = useState('')
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
    loadWorkspaces()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">
        Your Workspaces
      </h1>

      <form
        onSubmit={createWorkspace}
        className="mb-6 flex gap-2"
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New workspace name"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          required
        />

        <button className="rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">
          Create
        </button>
      </form>

      <div className="grid gap-3">
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            onClick={() => router.push(`/workspace/${ws.id}`)}
            className="flex cursor-pointer items-center justify-between rounded-xl border bg-white p-4 hover:shadow-sm"
          >
            <div>
              <p className="font-semibold text-gray-800">
                {ws.name}
              </p>

              <p className="text-xs text-gray-400">
                {ws.slug}
              </p>
            </div>

            <span className="rounded-full bg-blue-50 px-2 py-1 text-xs capitalize text-blue-700">
              {ws.role}
            </span>
          </div>
        ))}

        {workspaces.length === 0 && (
          <p className="text-sm text-gray-400">
            No workspaces yet — create your first one above.
          </p>
        )}
      </div>
    </div>
  )
}