import { useState, type FormEvent } from 'react'
import { useClientIdentity } from '../../shared/identity'
import { Button, Card, FieldMessage, FormField, Input, Label, PageContainer, PageIntro, PasswordInput } from '../../shared/ui'
import { LoginClientError, type LoginClient, type LoginFormInput } from './loginClient'
import { GoogleAuthenticationButton } from './GoogleAuthenticationButton'
import './AuthPage.css'

type FieldErrors = Partial<Record<keyof LoginFormInput, string>>

function readFormValue(form: FormData, name: string): string {
  const value = form.get(name)
  return typeof value === 'string' ? value : ''
}

function validate(input: LoginFormInput): FieldErrors {
  const errors: FieldErrors = {}
  if (!input.email.trim()) errors.email = 'Enter your email address.'
  if (!input.password) errors.password = 'Enter your password.'
  return errors
}

function loginErrorMessage(error: unknown): string {
  if (error instanceof LoginClientError && (error.code === 'INVALID_CREDENTIALS' || error.code === 'INVALID_REQUEST')) {
    return 'Email or password is incorrect.'
  }
  return 'Sign in is unavailable right now. Please try again.'
}

export interface LoginPageProps { client: LoginClient; onCancel?: () => void; onSuccess?: () => void }

export function LoginPage({ client, onCancel, onSuccess }: LoginPageProps) {
  const identity = useClientIdentity()
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const input = { email: readFormValue(form, 'email'), password: readFormValue(form, 'password') }
    const nextErrors = validate(input)
    setErrors(nextErrors)
    setSubmissionError(null)
    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)
    try {
      identity.login(await client.login(input))
      onSuccess?.()
    } catch (error) {
      setSubmissionError(loginErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageContainer spacing="standard" className="auth-page">
      <PageIntro eyebrow="Welcome back" title="Sign in to the arcade" description="Continue your progress and play with your account on this device." />
      <Card className="auth-page__card">
        <div className="auth-page__federated">
          <GoogleAuthenticationButton disabled={isSubmitting} />
          <span className="auth-page__separator">or sign in with email</span>
        </div>
        <form className="auth-page__form" noValidate onSubmit={(event) => void submit(event)}>
          <FormField invalid={Boolean(errors.email)} disabled={isSubmitting}>
            <Label>Email</Label>
            <Input name="email" type="email" inputMode="email" autoComplete="email" maxLength={254} />
            {errors.email && <FieldMessage variant="error">{errors.email}</FieldMessage>}
          </FormField>
          <FormField invalid={Boolean(errors.password)} disabled={isSubmitting}>
            <Label>Password</Label>
            <PasswordInput name="password" autoComplete="current-password" maxLength={128} />
            {errors.password && <FieldMessage variant="error">{errors.password}</FieldMessage>}
          </FormField>
          {submissionError && <p className="auth-page__error" role="alert">{submissionError}</p>}
          <div className="auth-page__actions">
            {onCancel && <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>}
            <Button type="submit" isLoading={isSubmitting} loadingLabel="Signing in">Sign in</Button>
          </div>
        </form>
      </Card>
    </PageContainer>
  )
}
