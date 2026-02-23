import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@/components/ui'
import { Eye, EyeOff } from 'lucide-react'
import type { InvitationSummary } from '@/types'

const acceptSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(7, 'Password must be at least 7 characters'),
})

type AcceptForm = z.infer<typeof acceptSchema>

export function InviteAcceptance() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [invitation, setInvitation] = useState<InvitationSummary | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'success'>('loading')
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptForm>({
    resolver: zodResolver(acceptSchema),
  })

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invitation token is missing.')
      return
    }

    const fetchInvitation = async () => {
      try {
        const response = await axios.get('/api/auth/invitation', { params: { token } })
        setInvitation(response.data.data)
        setStatus('ready')
      } catch (error: any) {
        setStatus('error')
        setMessage(error.response?.data?.message || 'Invitation could not be loaded.')
      }
    }

    fetchInvitation()
  }, [token])

  const onSubmit = async (data: AcceptForm) => {
    try {
      const response = await axios.post('/api/auth/accept-invitation', {
        token,
        username: data.username,
        password: data.password,
      })
      setStatus('success')
      setMessage(response.data?.message || 'Invitation accepted. You can now sign in.')
    } catch (error: any) {
      setStatus('error')
      setMessage(error.response?.data?.message || 'Invitation acceptance failed.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <Card>
          <CardHeader>
            <CardTitle>Accept invitation</CardTitle>
            <CardDescription>Join your OpenSys workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'loading' && <p className="text-sm text-gray-600">Loading invitation...</p>}
            {status === 'error' && (
              <div className="space-y-3">
                <p className="text-sm text-red-600">{message}</p>
                <Link to="/login" className="text-sm text-primary hover:underline">
                  Back to login
                </Link>
              </div>
            )}
            {status === 'success' && (
              <div className="space-y-3">
                <p className="text-sm text-emerald-600">{message}</p>
                <Link to="/login" className="mt-4 w-fit block text-sm text-white bg-primary px-4 py-2 rounded hover:bg-primary-dark">
                  Sign in to AIBase
                </Link>
              </div>
            )}
            {status === 'ready' && invitation ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-600">
                  <p><strong>Email:</strong> {invitation.email}</p>
                  <p><strong>Role:</strong> {invitation.role}</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium">Username</label>
                  <Input id="username" {...register('username')} autoComplete='username' />
                  {errors.username && <p className="text-xs text-red-600">{errors.username.message}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
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
                  {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full">Accept invitation</Button>
              </form>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
