export interface ValidationErrors {
  email?: string
  password?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateLoginForm(email: string, password: string): ValidationErrors {
  const errors: ValidationErrors = {}

  if (!email.trim()) {
    errors.email = 'Email is required'
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.email = 'Invalid email format'
  }

  if (!password.trim()) {
    errors.password = 'Password is required'
  }

  return errors
}
