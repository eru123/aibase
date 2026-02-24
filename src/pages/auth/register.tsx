import { useState } from 'react'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { goeyToast as toast } from "goey-toast";
import { Button, Input, Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { brandingConfig } from '../../utils/branding'
import axios from 'axios'

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(7, 'Password must be at least 7 characters'),
})

type RegisterForm = z.infer<typeof registerSchema>

export function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState<'register' | 'verify'>('register')
  const [verificationId, setVerificationId] = useState<string | null>(null)
  const [verificationExpiresAt, setVerificationExpiresAt] = useState<string | null>(null)
  const [otpCode, setOtpCode] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  if (user) {
    return <Navigate to="/" replace />
  }

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      const result = await register(data.username, data.email, data.password)
      if (result.status === 'authenticated') {
        toast.success('Account created successfully')
        navigate('/')
      } else if (result.status === 'verification_required') {
        setVerificationId(result.verificationId ?? null)
        setVerificationExpiresAt(result.expiresAt ?? null)
        setPendingEmail(data.email)
        setStep('verify')
        toast.success(result.message || 'Check your email for the verification code.')
      } else {
        toast.success(result.message || 'Account created. Awaiting admin approval.')
        navigate('/login')
      }
    } catch (error: any) {
      toast.error(error.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!verificationId) {
      toast.error('Missing verification request. Please sign up again.')
      setStep('register')
      return
    }
    if (!otpCode.trim()) {
      toast.error('Enter the verification code')
      return
    }

    setIsVerifying(true)
    try {
      const response = await axios.post('/api/auth/verify-signup', {
        verification_id: verificationId,
        code: otpCode.trim(),
      })
      const message = response.data?.message || response.data?.data?.message
      toast.success(message || 'Email verified. You can now sign in.')
      navigate('/login')
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Verification failed')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{brandingConfig.appShortName}</h1>
          <p className="text-gray-600">{brandingConfig.appName}</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {step === 'verify' ? 'Verify your email' : 'Create account'}
            </CardTitle>
            <CardDescription className="text-center">
              {step === 'verify'
                ? `Enter the code sent to ${pendingEmail || 'your email'}`
                : 'Create your account in minutes.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'verify' ? (
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="otp" className="text-sm font-medium">
                    Verification code
                  </label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    value={otpCode}
                    onChange={(event) => setOtpCode(event.target.value)}
                  />
                  {verificationExpiresAt ? (
                    <p className="text-xs text-gray-500">
                      Code expires at {new Date(verificationExpiresAt).toLocaleString()}
                    </p>
                  ) : null}
                </div>

                <Button type="submit" className="w-full" disabled={isVerifying}>
                  {isVerifying ? 'Verifying...' : 'Verify email'}
                </Button>

                <button
                  type="button"
                  className="w-full text-xs text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    setStep('register')
                    setOtpCode('')
                    setVerificationId(null)
                    setVerificationExpiresAt(null)
                  }}
                >
                  Use a different email
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium">
                    Username
                  </label>
                  <Input id="username" autoComplete="username" placeholder="opensys-user" {...formRegister('username')} />
                  {errors.username && <p className="text-sm text-red-600">{errors.username.message}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input id="email" type="email" autoComplete="email" placeholder="you@opensys.local" {...formRegister('email')} />
                  {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="********"
                      className="pr-10"
                      {...formRegister('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating account...' : 'Create account'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
