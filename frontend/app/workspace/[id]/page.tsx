'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import UploadDropzone from '../../components/UploadDropzone'
import { Button, RoleBadge, Avatar, EmptyState } from '../../components/ui'

type Member = { user_id: number; full_name: string; email: string; role: string }
type Invite = { email: string; role: string; sent_at: string }

type Doc = { id: number; filename: string; folder_id: number | null; size_bytes: number; status: string }
type FolderRow = { id: number; name: string; parent_id: number | null }

export default function WorkspaceDetail() {
  const { id } = useParams()
  const [tab, setTab] = useState<'documents' | 'members' | 'invites'>('documents')

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

  // filtered once, reused for both the list and the empty-state check
  const visibleDocs = docs.filter(d => activeFolder === null || d.folder_id === activeFolder)

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-line bg-surface">
        <div className="max-w-5xl mx-auto px-8 py-5">
          <a href="/dashboard" className="text-xs text-muted hover:text-brand">
            ← All workspaces
          </a>
          <h1 className="font-display text-2xl text-foreground mt-1">Workspace</h1>
        </div>
        <div className="max-w-5xl mx-auto px-8 flex gap-6 border-t border-line/60">
          {(['documents', 'members', 'invites'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                tab === t ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8">
        {/* ───────── DOCUMENTS ───────── */}
        {tab === 'documents' && (
          <div>
            <div className="mb-6">
              <UploadDropzone workspaceId={id as string} onUploaded={handleUploaded} />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="paper-stack rounded-xl border border-line bg-surface p-4 h-fit">
                <p className="text-xs font-semibold text-muted mb-2 tracking-wide">FOLDERS</p>
                <button
                  onClick={() => setActiveFolder(null)}
                  className={`block w-full text-left text-sm px-2.5 py-1.5 rounded-lg mb-0.5 transition-colors ${
                    activeFolder === null ? 'bg-brand/10 text-brand font-medium' : 'text-muted hover:bg-foreground/5'
                  }`}
                >
                  📁 All documents
                </button>
                {folders.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFolder(f.id)}
                    className={`block w-full text-left text-sm px-2.5 py-1.5 rounded-lg mb-0.5 transition-colors ${
                      activeFolder === f.id ? 'bg-brand/10 text-brand font-medium' : 'text-muted hover:bg-foreground/5'
                    }`}
                  >
                    📁 {f.name}
                  </button>
                ))}
              </div>

              <div className="col-span-3 paper-stack rounded-xl border border-line bg-surface divide-y divide-line">
                {visibleDocs.map((d) => (
                  <div key={d.id} className="flex justify-between items-center px-4 py-3.5 hover:bg-foreground/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center text-sm">📄</div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{d.filename}</p>
                        <p className="text-xs text-muted font-mono mt-0.5">
                          {formatSize(d.size_bytes)} · {d.status}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {visibleDocs.length === 0 && (
                  <EmptyState icon="📄" title="No documents found here" subtitle="Drag one into the box above to get started." />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ───────── MEMBERS ───────── */}
        {tab === 'members' && (
          <div className="paper-stack rounded-xl border border-line bg-surface overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-background text-muted text-left">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {members.map((m) => (
                  <tr key={m.user_id} className="hover:bg-foreground/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.full_name} />
                        <span className="font-medium text-foreground">{m.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted">{m.email}</td>
                    <td className="px-5 py-3">
                      <RoleBadge role={m.role} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ───────── INVITES ───────── */}
        {tab === 'invites' && (
          <div>
            <form onSubmit={sendInvite} className="paper-stack rounded-xl border border-line bg-surface p-5 mb-6 flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-muted mb-1.5">Invite by email</label>
                <input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  type="email"
                  required
                  className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand/30 focus:border-brand focus:outline-none"
                  placeholder="teammate@company.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="border border-line rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand/30 focus:border-brand focus:outline-none"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <Button type="submit">Invite</Button>
            </form>
            {inviteMsg && <p className="text-xs text-muted mb-6">{inviteMsg}</p>}

            <div className="paper-stack rounded-xl border border-line bg-surface">
              <p className="text-xs font-semibold text-muted px-5 pt-4 pb-2 tracking-wide">PENDING INVITES</p>
              <div className="divide-y divide-line">
                {invites.map((inv, i) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between text-sm">
                    <span className="text-foreground">{inv.email}</span>
                    <RoleBadge role={inv.role} />
                  </div>
                ))}
                {invites.length === 0 && (
                  <EmptyState icon="✉️" title="No pending invites" subtitle="Invites you send will show up here until accepted." />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
