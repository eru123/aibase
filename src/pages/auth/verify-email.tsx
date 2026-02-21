import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying your email...')

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error')
        setMessage('Verification token is missing.')
        return
      }
      try {
        const response = await axios.get('/api/auth/verify-email', { params: { token } })
        setStatus('success')
        setMessage(response.data?.message || 'Email verified successfully.')
      } catch (error: any) {
        setStatus('error')
        setMessage(error.response?.data?.message || 'Verification failed.')
      }
    }
    verify()
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8">
        <Card>
          <CardHeader>
            <CardTitle>Email verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
              {message}
            </p>
            <Link to="/login" className="text-sm text-primary hover:underline">
              Back to login
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
