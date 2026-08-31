import { useState, type FormEvent } from 'react'
import { useClientIdentity } from '../../shared/identity'
import { Button, Card, FieldMessage, FormField, Input, Label, PageContainer, PageIntro, PasswordInput } from '../../shared/ui'
import { RegistrationClientError, type RegistrationClient, type RegistrationFormInput } from './registrationClient'
import './RegistrationPage.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type FieldErrors = Partial<Record<keyof RegistrationFormInput, string>>

function validate(input: RegistrationFormInput): FieldErrors {
  const errors: FieldErrors = {}
  if (!input.name.trim()) errors.name = 'Enter your name.'
  if (!EMAIL_PATTERN.test(input.email.trim())) errors.email = 'Enter a valid email address.'
  if (input.password.length < 8) errors.password = 'Use at least 8 characters.'
  return errors
}

function registrationErrorMessage(error: unknown): string {
  if (error instanceof RegistrationClientError && error.code === 'DUPLICATE_EMAIL') {
    return 'An account with this email already exists.'
  }
  if (error instanceof RegistrationClientError && error.code === 'INVALID_REQUEST') {
    return 'Check your details and try again.'
  }
  return 'Registration is unavailable right now. Please try again.'
}

function readFormValue(form: FormData, name: string): string {
  const value = form.get(name)
  return typeof value === 'string' ? value : ''
}

export interface RegistrationPageProps {
  client: RegistrationClient
  onCancel?: () => void
  onSuccess?: () => void
}

export function RegistrationPage({ client, onCancel, onSuccess }: RegistrationPageProps) {
  const identity = useClientIdentity()
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const input = {
      name: readFormValue(form, 'name'),
      email: readFormValue(form, 'email'),
      password: readFormValue(form, 'password'),
    }
    const nextErrors = validate(input)
    setErrors(nextErrors)
    setSubmissionError(null)
    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)
    try {
      identity.login(await client.register(input))
      onSuccess?.()
    } catch (error) {
      setSubmissionError(registrationErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageContainer spacing="standard" className="registration-page">
      <PageIntro eyebrow="Create account" title="Join the arcade" description="Save your progress and play with the same account across your devices." />
      <Card className="registration-page__card">
        <form className="registration-page__form" noValidate onSubmit={(event) => void submit(event)}>
          <FormField invalid={Boolean(errors.name)} disabled={isSubmitting}>
            <Label>Name</Label>
            <Input name="name" autoComplete="name" maxLength={100} />
            {errors.name && <FieldMessage variant="error">{errors.name}</FieldMessage>}
          </FormField>
          <FormField invalid={Boolean(errors.email)} disabled={isSubmitting}>
            <Label>Email</Label>
            <Input name="email" type="email" inputMode="email" autoComplete="email" maxLength={254} />
            {errors.email && <FieldMessage variant="error">{errors.email}</FieldMessage>}
          </FormField>
          <FormField invalid={Boolean(errors.password)} disabled={isSubmitting}>
            <Label>Password</Label>
            <PasswordInput name="password" autoComplete="new-password" minLength={8} maxLength={128} />
            {errors.password
              ? <FieldMessage variant="error">{errors.password}</FieldMessage>
              : <FieldMessage>Use at least 8 characters.</FieldMessage>}
          </FormField>
          {submissionError && <p className="registration-page__error" role="alert">{submissionError}</p>}
          <div className="registration-page__actions">
            {onCancel && <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>}
            <Button type="submit" isLoading={isSubmitting} loadingLabel="Creating account">Create account</Button>
          </div>
        </form>
      </Card>
    </PageContainer>
  )
}
