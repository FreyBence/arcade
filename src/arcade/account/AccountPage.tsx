import { useState, type FormEvent } from 'react'
import { useClientIdentity } from '../../shared/identity'
import { Button, Card, FieldMessage, FormField, Input, Label, PageContainer, PageIntro, useToast } from '../../shared/ui'
import { ProfileClientError, type ProfileClient, type ProfileFormInput } from './profileClient'
import './AccountPage.css'

type FieldErrors = Partial<Record<keyof ProfileFormInput, string>>
function readFormValue(form: FormData, name: string): string {
  const value = form.get(name)
  return typeof value === 'string' ? value : ''
}
function validate(input: ProfileFormInput): FieldErrors {
  const errors: FieldErrors = {}
  if (!input.name.trim()) errors.name = 'Enter your name.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) errors.email = 'Enter a valid email address.'
  return errors
}
export function AccountPage({ client }: { client: ProfileClient }) {
  const identity = useClientIdentity()
  const { showToast } = useToast()
  const user = identity.state.status === 'authenticated' ? identity.state.user : null
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  if (!user) return null
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const input = { name: readFormValue(form, 'name'), email: readFormValue(form, 'email') }
    const nextErrors = validate(input); setErrors(nextErrors); setSubmissionError(null)
    if (Object.keys(nextErrors).length) return
    setIsSubmitting(true)
    try { identity.updateUser(await client.update(input)); showToast({ message: 'Profile updated.', variant: 'success' }) }
    catch (error) {
      setSubmissionError(error instanceof ProfileClientError && error.code === 'DUPLICATE_EMAIL' ? 'That email address is already in use.' : error instanceof ProfileClientError && error.code === 'INVALID_PROFILE' ? 'Check your name and email address.' : 'Profile update failed. Please try again.')
    } finally { setIsSubmitting(false) }
  }
  return <PageContainer spacing="standard" className="account-page">
    <PageIntro eyebrow="Your account" title="Profile" description="Keep your account details up to date." />
    <Card className="account-page__card"><form className="account-page__form" noValidate onSubmit={(event) => void submit(event)}>
      <FormField invalid={Boolean(errors.name)} disabled={isSubmitting}><Label>Name</Label><Input name="name" autoComplete="name" maxLength={100} defaultValue={user.name} />{errors.name && <FieldMessage variant="error">{errors.name}</FieldMessage>}</FormField>
      <FormField invalid={Boolean(errors.email)} disabled={isSubmitting}><Label>Email</Label><Input name="email" type="email" inputMode="email" autoComplete="email" maxLength={254} defaultValue={user.email} />{errors.email && <FieldMessage variant="error">{errors.email}</FieldMessage>}</FormField>
      {submissionError && <p className="account-page__error" role="alert">{submissionError}</p>}
      <div className="account-page__actions"><Button type="submit" isLoading={isSubmitting} loadingLabel="Saving">Save changes</Button></div>
    </form></Card>
  </PageContainer>
}
