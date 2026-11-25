import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { changePassword } from '../services/authService'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function ChangePassword() {
  const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.newPassword.length < 8) return toast.error('New password must be at least 8 characters')
    if (formData.newPassword !== formData.confirmPassword) return toast.error('New passwords do not match')
    
    setLoading(true)
    try {
      await changePassword({ currentPassword: formData.currentPassword, newPassword: formData.newPassword })
      toast.success('Password changed successfully')
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const PasswordField = ({ label, name, showKey }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative mt-1">
        <input
          type={showPwd[showKey] ? 'text' : 'password'}
          required
          className="input-field pr-10"
          value={formData[name]}
          onChange={e => setFormData({ ...formData, [name]: e.target.value })}
        />
        <button
          type="button"
          onClick={() => setShowPwd({ ...showPwd, [showKey]: !showPwd[showKey] })}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          {showPwd[showKey] ? <EyeSlashIcon className="h-5 w-5 text-gray-400" /> : <EyeIcon className="h-5 w-5 text-gray-400" />}
        </button>
      </div>
    </div>
  )

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <h2 className="text-xl font-bold mb-6">Change Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordField label="Current Password" name="currentPassword" showKey="current" />
          <PasswordField label="New Password" name="newPassword" showKey="new" />
          <PasswordField label="Confirm New Password" name="confirmPassword" showKey="confirm" />
          <div className="pt-4">
            <button type="submit" disabled={loading} className="w-full btn-primary">
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
