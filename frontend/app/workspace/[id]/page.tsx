'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import UploadDropzone from '../../components/UploadDropzone'

type Member = { user_id: number; full_name: string; email: string; role: string }
type Invite = { email: string; role: string; sent_at: string }

type Doc = { id: number; filename: string; folder_id: number | null; size_bytes: number; status: string }
type FolderRow = { id: number; name: string; parent_id: number | null }

export default function WorkspaceDetail() {
  const { id } = useParams()
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('viewer')
  const [inviteMsg, setInviteMsg] = useState('')

  const [docs, setDocs] = useState<Doc[]>([])
  const [folders, setFolders] = useState<FolderRow[]>([])
  const [activeFolder, setActiveFolder] = useState<number | null>(null)

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

  async function loadDocs() {
    const token = localStorage.getItem('token')
    const res = await fetch(`http://localhost:8000/workspaces/${id}/documents/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) setDocs(await res.json())
  }

  async function loadFolders() {
    const token = localStorage.getItem('token')
    const res = await fetch(`http://localhost:8000/workspaces/${id}/folders/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) setFolders(await res.json())
  }

  useEffect(() => {
    loadMembers()
    loadInvites()
    loadDocs()
    loadFolders()
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

  function handleUploaded() {
    loadDocs()
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* --- SECTION 1: TOP ACTION BAR (INVITES) --- */}
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Workspace Controls</h1>

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

      {/* --- SECTION 2: UPLOAD DROPZONE --- */}
      <div className="mb-6">
        <UploadDropzone workspaceId={id as string} onUploaded={handleUploaded} />
      </div>

      {/* --- SECTION 3: FOLDERS AND DOCUMENTS GRID SYSTEM --- */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">Files & Storage</h2>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {/* Left Side Folder Filter Column */}
        <div className="bg-white border rounded-xl p-4 h-fit">
          <p className="text-xs font-semibold text-gray-500 mb-2">FOLDERS</p>
          <button
            onClick={() => setActiveFolder(null)}
            className={`block w-full text-left text-sm px-2 py-1.5 rounded transition-colors ${
              activeFolder === null ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📁 All documents
          </button>
          {folders.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFolder(f.id)}
              className={`block w-full text-left text-sm px-2 py-1.5 rounded mt-1 transition-colors ${
                activeFolder === f.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              📁 {f.name}
            </button>
          ))}
        </div>

        {/* Right Side Filtered Document List Column */}
        <div className="col-span-3 bg-white border rounded-xl divide-y">
          {docs
            .filter(d => activeFolder === null || d.folder_id === activeFolder)
            .map(d => (
              <div key={d.id} className="flex justify-between items-center px-4 py-3 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-800">{d.filename}</p>
                  <p className="text-xs text-gray-400">{formatSize(d.size_bytes)} · {d.status}</p>
                </div>
              </div>
            ))}
          {docs.filter(d => activeFolder === null || d.folder_id === activeFolder).length === 0 && (
            <p className="text-sm text-gray-400 p-4 text-center">No documents found here — drag one in above.</p>
          )}
        </div>
      </div>

      {/* --- SECTION 4: TEAM MANAGEMENT SYSTEM --- */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">Team Directory</h2>
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.user_id} className="border-t hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-700">{m.full_name}</td>
                <td className="px-4 py-3 text-gray-500">{m.email}</td>
                <td className="px-4 py-3 capitalize">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    m.role === 'admin' ? 'bg-red-50 text-red-700' : m.role === 'editor' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {m.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}