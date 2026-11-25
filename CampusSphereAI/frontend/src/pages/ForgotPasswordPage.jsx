import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { forgotPassword, verifyOtp, resetPassword } from '../services/authService'
import { EyeIcon, EyeSlashIcon, AcademicCapIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [username, setUsername] = useState('')
  const [otp, setOtp] = useState('')
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300)

  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000)
      return () => clearInterval(timer)
    }
  }, [step, timeLeft])

  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!username.trim()) return toast.error('Enter your enrollment number')
    setLoading(true)
    try {
      await forgotPassword({ enrollmentNumber: username.trim().toUpperCase() })
      toast.success('OTP sent to your registered email')
      setStep(2)
      setTimeLeft(300)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) return toast.error('Enter 6-digit OTP')
    setLoading(true)
    try {
      await verifyOtp({ enrollmentNumber: username.trim().toUpperCase(), otp })
      toast.success('OTP verified! Set your new password.')
      setStep(3)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (passwords.newPassword.length < 8) return toast.error('Password must be at least 8 characters')
    if (passwords.newPassword !== passwords.confirmPassword) return toast.error('Passwords do not match')
    setLoading(true)
    try {
      await resetPassword({
        enrollmentNumber: username.trim().toUpperCase(),
        otp,
        newPassword: passwords.newPassword,
        confirmPassword: passwords.confirmPassword
      })
      toast.success('Password reset successful! Please login.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="mb-6">
          <button onClick={() => navigate('/login')} className="flex items-center text-sm text-gray-500 hover:text-indigo-600">
            <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back to Login
          </button>
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-6 text-center">Reset Password</h2>

        <div className="flex justify-between mb-8 relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -z-10 -translate-y-1/2"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= i ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {i}
            </div>
          ))}
        </div>

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Enrollment Number</label>
              <input type="text" required className="mt-1 input-field uppercase" placeholder="e.g. 2301234567"
                value={username} onChange={e => setUsername(e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">Enter your enrollment number to receive an OTP</p>
            </div>
            <button type="submit" disabled={loading} className="w-full btn-primary">{loading ? 'Sending...' : 'Send OTP'}</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Enter 6-digit OTP</label>
              <input type="text" maxLength={6} required className="mt-1 input-field text-center text-xl tracking-widest" value={otp} onChange={e => setOtp(e.target.value)} />
            </div>
            <div className="text-sm text-center text-gray-500">
              Time left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
            <button type="submit" disabled={loading} className="w-full btn-primary">{loading ? 'Verifying...' : 'Verify OTP'}</button>
            <button type="button" onClick={handleSendOtp} disabled={timeLeft > 0 || loading} className="w-full text-sm text-indigo-600 disabled:text-gray-400">
              Resend OTP
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <div className="relative mt-1">
                <input type={showPassword ? 'text' : 'password'} required className="input-field pr-10" value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {showPassword ? <EyeSlashIcon className="h-5 w-5 text-gray-400" /> : <EyeIcon className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input type={showPassword ? 'text' : 'password'} required className="mt-1 input-field" value={passwords.confirmPassword} onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})} />
            </div>
            <button type="submit" disabled={loading} className="w-full btn-primary">{loading ? 'Resetting...' : 'Reset Password'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
