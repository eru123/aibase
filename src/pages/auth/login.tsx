import { useState, useEffect } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button, Input, Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { AdminSetup } from './admin-setup'
import { brandingConfig } from '../../utils/branding'
import axios from 'axios'

const loginSchema = z.object({
  identifier: z.string().min(1, 'Username or email is required').superRefine((val, ctx) => {
    // If it looks like an email (contains @ + host . domain)
    if (val.includes('@') && val.split('@')[1].includes('.')) {
      const result = z.string().email().safeParse(val)
      if (!result.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please enter a valid email address',
        })
      }
    } else {
      // Otherwise treat as username
      if (val.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Username must be at least 3 characters',
        })
      }
    }
  }),
  password: z.string().min(7, 'Password must be at least 7 characters'),
  rememberMe: z.boolean().optional(),
})

type LoginForm = z.infer<typeof loginSchema>

export function Login() {
  const { user, login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [hasAdmins, setHasAdmins] = useState<boolean | null>(null)
  const [checkingAdmins, setCheckingAdmins] = useState(true)
  const [adminCountError, setAdminCountError] = useState<string | null>(null)
  const [allowSignup, setAllowSignup] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  // Check if any admin users exist on component mount
  useEffect(() => {
    const checkAdminCount = async () => {
      try {
        const response = await axios.get('/api/auth/admin-count')
        // API returns { count: number, hasAdmin: boolean } directly
        setHasAdmins(response.data.hasAdmin)
        setAdminCountError(null)
      } catch (error) {
        console.error('Error checking admin count:', error)
        const responseMessage = (error as any)?.response?.data?.message
        const responseCode = (error as any)?.response?.data?.code
        if (
          responseCode === '42S02' ||
          (typeof responseMessage === 'string' && /Base table|doesn't exist/i.test(responseMessage))
        ) {
          setAdminCountError(
            `Server database is not configured. ${responseMessage ?? ''}`.trim()
          )
        } else {
          setAdminCountError('Unable to check system status. Please contact support.')
        }
      } finally {
        setCheckingAdmins(false)
      }
    }

    checkAdminCount()

    // Check if registration is allowed
    axios.get('/api/system-settings/public')
      .then(response => {
        // Handle various boolean representations
        const val = response.data?.data?.allow_registration
        const allowed = val === true || val === 'true' || val === 1 || val === '1'
        setAllowSignup(allowed)
      })
      .catch(err => console.error('Failed to load public settings', err))
  }, [])


  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />
  }

  // Show loading while checking admin status
  if (checkingAdmins) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking system status...</p>
        </div>
      </div>
    )
  }

  if (adminCountError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-6 p-8 text-center">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {adminCountError}
          </div>
          <p className="text-xs text-gray-500">
            Configure the database connection in the server environment and refresh this page.
          </p>
        </div>
      </div>
    )
  }

  // Show admin setup if no admins exist
  if (hasAdmins === false) {
    return <AdminSetup onSetupComplete={() => setHasAdmins(true)} />
  }

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)

    try {
      await login(data.identifier, data.password, data.rememberMe || false)
      toast.success('Logged in successfully')
    } catch (error: any) {
      toast.error(error.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {brandingConfig.appShortName}
          </h1>
          <p className="text-gray-600">{brandingConfig.appName}</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Sign in</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="identifier" className="text-sm font-medium">
                  Username or Email
                </label>
                <Input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your username or email"
                  {...register('identifier')}
                />
                {errors.identifier && (
                  <p className="text-sm text-red-600">{errors.identifier.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="pr-10"
                    {...register('password')}
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
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    {...register('rememberMe')}
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <a href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                    Forgot password?
                  </a>
                </div>
              </div>

              <Button
                type="submit"
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            {false && <div className="mt-6 text-center text-sm text-gray-600">
              <p>Demo Credentials:</p>
              <p>Email: admin@example.com</p>
              <p>Password: AdminPassword123!</p>
            </div>}
          </CardContent>
        </Card>

        {allowSignup && (
          <p className="text-center text-sm text-gray-600">
            Need an account?{' '}
            <Link to="/register" className="text-primary hover:underline">
              Create one
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
