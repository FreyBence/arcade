import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useClientIdentity } from '../../shared/identity'
import { PROFILE_IMAGE_ACCEPTED_TYPES, PROFILE_IMAGE_MAX_BYTES } from '../../shared/profile'
import { Button, Card, FieldMessage, FormField, Input, Label, PageContainer, PageIntro, PasswordInput, useToast } from '../../shared/ui'
import { ProfileClientError, type ProfileClient, type ProfileFormInput } from './profileClient'
import { PasswordClientError, type PasswordClient } from './passwordClient'
import './AccountPage.css'
import defaultProfilePicture from '../../assets/default-profile-dinosaur.png'

type FieldErrors = Partial<Record<keyof ProfileFormInput, string>>
const readValue = (form: FormData, name: string) => { const value = form.get(name); return typeof value === 'string' ? value : '' }
function readImage(file: File): Promise<string> { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error()); reader.onerror = reject; reader.readAsDataURL(file) }) }

export function AccountPage({ client, passwordClient }: { client: ProfileClient; passwordClient: PasswordClient }) {
  const identity = useClientIdentity(); const { showToast } = useToast()
  const user = identity.state.status === 'authenticated' ? identity.state.user : null
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage ?? null)
  const [imageError, setImageError] = useState<string | null>(null); const [errors, setErrors] = useState<FieldErrors>({})
  const [submissionError, setSubmissionError] = useState<string | null>(null); const [isSubmitting, setIsSubmitting] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<Partial<Record<'currentPassword' | 'newPassword' | 'confirmation', string>>>({})
  const [passwordSubmissionError, setPasswordSubmissionError] = useState<string | null>(null); const [isChangingPassword, setIsChangingPassword] = useState(false)
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
  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const target = event.currentTarget; const form = new FormData(target)
    const currentPassword = readValue(form, 'currentPassword'); const newPassword = readValue(form, 'newPassword'); const confirmation = readValue(form, 'confirmation')
    const nextErrors: typeof passwordErrors = {}
    if (!currentPassword) nextErrors.currentPassword = 'Enter your current password.'
    if (newPassword.length < 8) nextErrors.newPassword = 'Use at least 8 characters.'
    else if (newPassword.length > 128) nextErrors.newPassword = 'Use no more than 128 characters.'
    if (!confirmation) nextErrors.confirmation = 'Confirm your new password.'
    else if (newPassword !== confirmation) nextErrors.confirmation = 'Passwords do not match.'
    setPasswordErrors(nextErrors); setPasswordSubmissionError(null); if (Object.keys(nextErrors).length) return
    setIsChangingPassword(true)
    try { await passwordClient.change({ currentPassword, newPassword }); target.reset(); showToast({ message: 'Password changed.', variant: 'success' }) }
    catch (error) { setPasswordSubmissionError(error instanceof PasswordClientError && error.code === 'INCORRECT_CURRENT_PASSWORD' ? 'Your current password is incorrect.' : error instanceof PasswordClientError && error.code === 'INVALID_PASSWORD_CHANGE' ? 'Check your password details.' : 'Password change failed. Please try again.') }
    finally { setIsChangingPassword(false) }
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
    </form></Card>
    <Card className="account-page__card"><form className="account-page__form" noValidate onSubmit={(event) => void submitPassword(event)}>
      <div><h2 className="account-page__section-title">Change password</h2><p className="account-page__section-description">Confirm your current password before choosing a new one.</p></div>
      <FormField invalid={Boolean(passwordErrors.currentPassword)} disabled={isChangingPassword}><Label>Current password</Label><PasswordInput name="currentPassword" autoComplete="current-password" maxLength={128} />{passwordErrors.currentPassword && <FieldMessage variant="error">{passwordErrors.currentPassword}</FieldMessage>}</FormField>
      <FormField invalid={Boolean(passwordErrors.newPassword)} disabled={isChangingPassword}><Label>New password</Label><PasswordInput name="newPassword" autoComplete="new-password" maxLength={128} />{passwordErrors.newPassword ? <FieldMessage variant="error">{passwordErrors.newPassword}</FieldMessage> : <FieldMessage variant="hint">Use 8 to 128 characters.</FieldMessage>}</FormField>
      <FormField invalid={Boolean(passwordErrors.confirmation)} disabled={isChangingPassword}><Label>Confirm new password</Label><PasswordInput name="confirmation" autoComplete="new-password" maxLength={128} />{passwordErrors.confirmation && <FieldMessage variant="error">{passwordErrors.confirmation}</FieldMessage>}</FormField>
      {passwordSubmissionError && <p className="account-page__error" role="alert">{passwordSubmissionError}</p>}<div className="account-page__actions"><Button type="submit" isLoading={isChangingPassword} loadingLabel="Changing">Change password</Button></div>
    </form></Card></PageContainer>
}
