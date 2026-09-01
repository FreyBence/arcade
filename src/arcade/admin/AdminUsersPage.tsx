import { useEffect, useState, type FormEvent } from 'react'
import defaultProfilePicture from '../../assets/default-profile-dinosaur.png'
import type { ClientIdentityUser } from '../../shared/identity'
import { Button, Card, EmptyState, ErrorState, FieldMessage, FormField, Input, Label, LoadingState, PageContainer, PageIntro, useToast } from '../../shared/ui'
import type { AdminUsersClient } from './adminUsersClient'
import './AdminUsersPage.css'

export function AdminUsersPage({ client }: { client: AdminUsersClient }) {
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<ClientIdentityUser[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let active = true
    client.search(query).then(
      (result) => { if (active) { setUsers(result); setState('ready') } },
      () => { if (active) setState('error') },
    )
    return () => { active = false }
  }, [client, query])

  function updateUser(updated: ClientIdentityUser) {
    setUsers((current) => current.map((user) => user.id === updated.id ? updated : user))
    showToast({ message: `Updated ${updated.name}'s Dino Coin balance.`, variant: 'success' })
  }

  return <PageContainer spacing="standard" className="admin-users-page">
    <PageIntro eyebrow="Admin" title="Users" description="Find registered users by name or email." />
    <FormField><Label htmlFor="admin-user-search">Search users</Label><Input id="admin-user-search" type="search" value={query} onChange={(event) => { setState('loading'); setQuery(event.target.value) }} placeholder="Name or email" autoComplete="off" /></FormField>
    {state === 'loading' && <LoadingState title="Loading users" message="Fetching registered accounts." />}
    {state === 'error' && <ErrorState title="Users unavailable" message="The user list could not be loaded. Please try again." />}
    {state === 'ready' && users.length === 0 && <EmptyState title="No users found" message={query ? `No registered users match “${query}”.` : 'There are no registered users.'} />}
    {state === 'ready' && users.length > 0 && <ul className="admin-users-page__list" aria-label="Registered users">{users.map((user) => <li key={user.id}>
      <Card className="admin-users-page__user">
        <img className="admin-users-page__avatar" src={user.profileImage ?? defaultProfilePicture} alt="" />
        <div className="admin-users-page__identity"><h2>{user.name}</h2><p>{user.email}</p></div>
        <dl className="admin-users-page__details"><div><dt>Role</dt><dd>{user.role}</dd></div></dl>
        <DinoCoinForm user={user} client={client} onUpdated={updateUser} />
      </Card>
    </li>)}</ul>}
  </PageContainer>
}

function DinoCoinForm({ user, client, onUpdated }: { user: ClientIdentityUser; client: AdminUsersClient; onUpdated: (user: ClientIdentityUser) => void }) {
  const [balance, setBalance] = useState(String(user.dinoCoins))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = Number(balance)
    if (!balance.trim() || !Number.isInteger(value) || value < 0) { setError('Enter a non-negative whole number.'); return }
    setSaving(true); setError(null)
    try {
      const updated = await client.updateDinoCoins(user.id, value)
      setBalance(String(updated.dinoCoins)); onUpdated(updated)
    } catch { setError('The Dino Coin balance could not be updated. Please try again.') }
    finally { setSaving(false) }
  }

  return <form className="admin-users-page__coins" onSubmit={(event) => void submit(event)} noValidate>
    <FormField invalid={Boolean(error)} disabled={saving}>
      <Label>Dino Coins</Label>
      <div className="admin-users-page__coin-controls"><Input type="number" min="0" step="1" value={balance} onChange={(event) => setBalance(event.target.value)} /><Button type="submit" size="small" isLoading={saving} loadingLabel="Saving">Save</Button></div>
      {error && <FieldMessage variant="error">{error}</FieldMessage>}
    </FormField>
  </form>
}
