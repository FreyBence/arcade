import { useEffect, useState } from 'react'
import defaultProfilePicture from '../../assets/default-profile-dinosaur.png'
import type { ClientIdentityUser } from '../../shared/identity'
import { Card, EmptyState, ErrorState, FormField, Input, Label, LoadingState, PageContainer, PageIntro } from '../../shared/ui'
import type { AdminUsersClient } from './adminUsersClient'
import './AdminUsersPage.css'

export function AdminUsersPage({ client }: { client: AdminUsersClient }) {
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
        <dl className="admin-users-page__details"><div><dt>Role</dt><dd>{user.role}</dd></div><div><dt>Dino Coins</dt><dd>{user.dinoCoins}</dd></div></dl>
      </Card>
    </li>)}</ul>}
  </PageContainer>
}
