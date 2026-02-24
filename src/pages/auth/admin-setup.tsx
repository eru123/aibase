import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { goeyToast as toast } from "goey-toast";
import { Button, Input, Card, CardHeader, CardContent, CardTitle, CardDescription, Badge, Label } from '@/components/ui'
import { useAuth } from '../../lib/auth'
import { Settings, Shield, CheckCircle, Eye, EyeOff, Loader2, User } from 'lucide-react'
import axios from 'axios'
import { brandingConfig } from '../../utils/branding'

const setupAdminSchema = z
  .object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(7, 'Password must be at least 7 characters'),
    confirmPassword: z.string().min(7, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type SetupAdminForm = z.infer<typeof setupAdminSchema>

interface AdminSetupProps {
  onSetupComplete: () => void
}

export function AdminSetup({ onSetupComplete }: AdminSetupProps) {
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupAdminForm>({
    resolver: zodResolver(setupAdminSchema),
  })

  const onSubmit = async (data: SetupAdminForm) => {
    setIsLoading(true)
    try {
      const payload = {
        username: data.username,
        email: data.email,
        password: data.password,
      }

      const response = await axios.post('/api/auth/setup-admin', payload)

      if (response.data) {
        setIsSuccess(true)
        toast.success('Admin account created successfully!')

        setTimeout(async () => {
          try {
            await login(data.email, data.password)
            onSetupComplete()
          } catch (error) {
            console.error('Auto-login failed:', error)
            onSetupComplete()
          }
        }, 2000)
      } else {
        throw new Error('Setup failed')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Setup failed'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center px-6 py-16">
          <Card className="w-full border border-border/60 shadow-lg">
            <CardHeader className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <Badge variant="outline" className="rounded-full px-3 py-1 text-xs uppercase tracking-wide text-emerald-700">
                  Setup complete
                </Badge>
                <CardTitle className="text-2xl font-semibold text-foreground">You&apos;re all set!</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Your administrator account is ready. We&apos;re logging you in and preparing your workspace.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-center text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                <span>Redirecting to your dashboard…</span>
              </div>
              <p>You can close this window if you&apos;re not automatically redirected within a few seconds.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen w-full max-w-screen-sm items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full space-y-10">
          <div className="space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Shield className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <Badge variant="outline" className="rounded-full px-3 py-1 text-xs uppercase tracking-wide">
                First-time setup
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Welcome to {brandingConfig.appName}
              </h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                Let&apos;s create your administrator account and set up OpenSys Portal.
              </p>
            </div>
          </div>

          <Card className="border border-border/70 shadow-sm">
            <CardHeader className="space-y-2 border-b border-border/70 pb-6">
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
                <Settings className="h-4 w-4" />
                Guided admin setup
              </div>
              <CardTitle className="text-center text-2xl font-semibold text-foreground">
                Create the primary administrator account
              </CardTitle>
              <CardDescription className="text-center text-sm text-muted-foreground">
                We&apos;ll use this information to configure your OpenSys workspace. You can add more team members later.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <section className="space-y-6 rounded-xl border border-border/60 bg-card p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <User className="h-4 w-4 text-primary" />
                      User Account
                    </div>
                    <span className="text-xs text-muted-foreground">Administrator credentials</span>
                  </div>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" placeholder="admin" {...register('username')} autoComplete='username' />
                      {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="admin@opensys.local" {...register('email')} autoComplete='email' />
                      {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>
                  </div>
                </section>

                <section className="space-y-6 rounded-xl border border-border/60 bg-card p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Shield className="h-4 w-4 text-primary" />
                      Secure access
                    </div>
                    <span className="text-xs text-muted-foreground">Keep your credentials safe</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Minimum 7 characters"
                          autoComplete="new-password"
                          className="pr-10"
                          {...register('password')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="Confirm password"
                          className="pr-10"
                          {...register('confirmPassword')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                      )}
                    </div>
                  </div>
                </section>

                <div className="flex items-center justify-end">
                  <Button type="submit" disabled={isLoading} className="min-w-[180px]">
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Setting up...
                      </span>
                    ) : (
                      'Create admin account'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
