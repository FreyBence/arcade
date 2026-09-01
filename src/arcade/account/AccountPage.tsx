import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useClientIdentity } from '../../shared/identity'
import { PROFILE_IMAGE_ACCEPTED_TYPES, PROFILE_IMAGE_MAX_BYTES } from '../../shared/profile'
import { Button, Card, FieldMessage, FormField, Input, Label, PageContainer, PageIntro, useToast } from '../../shared/ui'
import { ProfileClientError, type ProfileClient, type ProfileFormInput } from './profileClient'
import './AccountPage.css'
import defaultProfilePicture from '../../assets/default-profile-dinosaur.png'

type FieldErrors = Partial<Record<keyof ProfileFormInput, string>>
const readValue = (form: FormData, name: string) => { const value = form.get(name); return typeof value === 'string' ? value : '' }
function readImage(file: File): Promise<string> { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error()); reader.onerror = reject; reader.readAsDataURL(file) }) }

export function AccountPage({ client }: { client: ProfileClient }) {
  const identity = useClientIdentity(); const { showToast } = useToast()
  const user = identity.state.status === 'authenticated' ? identity.state.user : null
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage ?? null)
  const [imageError, setImageError] = useState<string | null>(null); const [errors, setErrors] = useState<FieldErrors>({})
  const [submissionError, setSubmissionError] = useState<string | null>(null); const [isSubmitting, setIsSubmitting] = useState(false)
  if (!user) return null
  async function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return
    if (!PROFILE_IMAGE_ACCEPTED_TYPES.includes(file.type as typeof PROFILE_IMAGE_ACCEPTED_TYPES[number])) return setImageError('Choose a JPEG, PNG, or WebP image.')
    if (file.size > PROFILE_IMAGE_MAX_BYTES) return setImageError('Choose an image smaller than 1 MB.')
    try { setProfileImage(await readImage(file)); setImageError(null) } catch { setImageError('The image could not be read.') }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget)
    const input = { name: readValue(form, 'name'), email: readValue(form, 'email'), profileImage }
    const nextErrors: FieldErrors = {}
    if (!input.name.trim()) nextErrors.name = 'Enter your name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) nextErrors.email = 'Enter a valid email address.'
    setErrors(nextErrors); setSubmissionError(null); if (Object.keys(nextErrors).length || imageError) return
    setIsSubmitting(true)
    try { identity.updateUser(await client.update(input)); showToast({ message: 'Profile updated.', variant: 'success' }) }
    catch (error) { setSubmissionError(error instanceof ProfileClientError && error.code === 'DUPLICATE_EMAIL' ? 'That email address is already in use.' : error instanceof ProfileClientError && error.code === 'INVALID_PROFILE' ? 'Check your profile details and picture.' : 'Profile update failed. Please try again.') }
    finally { setIsSubmitting(false) }
  }
  return <PageContainer spacing="standard" className="account-page"><PageIntro eyebrow="Your account" title="Profile" description="Keep your account details up to date." />
    <Card className="account-page__card"><form className="account-page__form" noValidate onSubmit={(event) => void submit(event)}>
      <div className="account-page__picture-field">
        <img className="account-page__picture-preview" src={profileImage ?? defaultProfilePicture} alt="Profile preview" />
        <div><Label htmlFor="profile-picture">Profile picture</Label><Input id="profile-picture" type="file" accept={PROFILE_IMAGE_ACCEPTED_TYPES.join(',')} onChange={(event) => void selectImage(event)} disabled={isSubmitting} />
          <FieldMessage variant={imageError ? 'error' : 'hint'}>{imageError ?? 'JPEG, PNG, or WebP. Maximum 1 MB.'}</FieldMessage>{profileImage && <Button size="small" variant="ghost" onClick={() => setProfileImage(null)} disabled={isSubmitting}>Remove picture</Button>}</div>
      </div>
      <FormField invalid={Boolean(errors.name)} disabled={isSubmitting}><Label>Name</Label><Input name="name" autoComplete="name" maxLength={100} defaultValue={user.name} />{errors.name && <FieldMessage variant="error">{errors.name}</FieldMessage>}</FormField>
      <FormField invalid={Boolean(errors.email)} disabled={isSubmitting}><Label>Email</Label><Input name="email" type="email" inputMode="email" autoComplete="email" maxLength={254} defaultValue={user.email} />{errors.email && <FieldMessage variant="error">{errors.email}</FieldMessage>}</FormField>
      {submissionError && <p className="account-page__error" role="alert">{submissionError}</p>}<div className="account-page__actions"><Button type="submit" isLoading={isSubmitting} loadingLabel="Saving">Save changes</Button></div>
    </form></Card></PageContainer>
}
