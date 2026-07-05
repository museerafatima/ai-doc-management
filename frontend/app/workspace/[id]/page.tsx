'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type Member = { user_id: number; full_name: string; email: string; role: string }
type Invite = { email: string; role: string; sent_at: string }

export default function WorkspaceDetail() {
  const { id } = useParams()
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('viewer')
  const [inviteMsg, setInviteMsg] = useState('')

  async function loadMembers() {
    const token = localStorage.getItem('token')
    const res = await fetch(`http://localhost:8000/workspaces/${id}/members`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) setMembers(await res.json())
  }

  async function loadInvites() {
    const token = localStorage.getItem('token')
    const res = await fetch(`http://localhost:8000/workspaces/${id}/invites`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) setInvites(await res.json())
  }

  useEffect(() => {
    loadMembers()
    loadInvites()
  }, [id])

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault()
    const token = localStorage.getItem('token')
    const res = await fetch(`http://localhost:8000/workspaces/${id}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    })
    if (res.ok) {
      setInviteMsg(`Invite sent to ${inviteEmail}`)
      setInviteEmail('')
      loadInvites()
    } else {
      setInviteMsg('Could not send invite — admin role required')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Team Members</h1>

      <form onSubmit={sendInvite} className="bg-white border rounded-xl p-4 mb-4 flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Invite by email</label>
          <input
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            type="email"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="teammate@company.com"
          />
        </div>
        <select
          value={inviteRole}
          onChange={e => setInviteRole(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="viewer">Viewer</option>
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
        </select>
        <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">
          Invite
        </button>
      </form>
      {inviteMsg && <p className="text-xs text-gray-500 mb-4">{inviteMsg}</p>}

      {invites.length > 0 && (
        <div className="mb-4 text-xs text-gray-500">
          <p className="font-medium mb-1">Pending invites</p>
          {invites.map((inv, i) => (
            <p key={i}>{inv.email} — invited as {inv.role}</p>
          ))}
        </div>
      )}

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.user_id} className="border-t">
                <td className="px-4 py-2">{m.full_name}</td>
                <td className="px-4 py-2 text-gray-500">{m.email}</td>
                <td className="px-4 py-2 capitalize">{m.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}