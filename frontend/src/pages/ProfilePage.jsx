import React, { useState } from 'react';
import { Mail, Phone, MapPin, Save, KeyRound } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    mobile: user?.mobile || '',
    address: user?.address || '',
    businessName: user?.businessName || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileChange = (e) => setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg({ text: '', type: '' });
    setProfileLoading(true);
    try {
      const res = await API.put('/profile', profileForm);
      updateUser(res.data);
      setProfileMsg({ text: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      setProfileMsg({ text: err.response?.data?.message || 'Update failed', type: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ text: '', type: '' });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return setPasswordMsg({ text: 'New passwords do not match', type: 'error' });
    }
    if (passwordForm.newPassword.length < 6) {
      return setPasswordMsg({ text: 'Password must be at least 6 characters', type: 'error' });
    }

    setPasswordLoading(true);
    try {
      await API.put('/profile/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordMsg({ text: 'Password changed successfully!', type: 'success' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordMsg({ text: err.response?.data?.message || 'Failed to change password', type: 'error' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const avatarLetter = user?.name?.charAt(0).toUpperCase() || 'G';

  const msgClass = (type) =>
    `mb-4 rounded-lg px-3.5 py-2.5 text-sm ${type === 'success' ? 'bg-leaf-50 text-leaf-700' : 'bg-red-50 text-red-600'}`;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 p-8">
        <h1 className="mb-6 font-display text-2xl font-semibold text-slate-900">My Profile</h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
          {/* Left: Avatar Card */}
          <div>
            <div className="card flex flex-col items-center text-center">
              <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-leaf-600 text-2xl font-bold text-white">
                {avatarLetter}
              </div>
              <div className="text-lg font-semibold text-slate-900">{user?.name}</div>
              <div className="mb-4 text-xs capitalize text-slate-400">{user?.type}</div>
              <div className="w-full space-y-2.5 text-left text-sm text-slate-500">
                <div className="flex items-center gap-2"><Mail size={14} /><span className="truncate">{user?.email}</span></div>
                <div className="flex items-center gap-2"><Phone size={14} /><span>{user?.mobile}</span></div>
                <div className="flex items-center gap-2"><MapPin size={14} /><span>{user?.address}</span></div>
              </div>
            </div>

            <div className="card mt-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Account Info</h3>
              <div className="space-y-1.5 text-sm text-slate-500">
                <div><span className="font-medium text-slate-700">Account Type:</span> <span className="capitalize">{user?.type}</span></div>
                <div><span className="font-medium text-slate-700">Email:</span> {user?.email}</div>
                <div><span className="font-medium text-slate-700">Member since:</span> {new Date().getFullYear()}</div>
              </div>
            </div>
          </div>

          {/* Right: Edit Forms */}
          <div className="space-y-5">
            <div className="card">
              <h2 className="mb-4 text-base font-semibold text-slate-900">Edit Profile</h2>
              {profileMsg.text && <div className={msgClass(profileMsg.type)}>{profileMsg.text}</div>}
              <form onSubmit={saveProfile} className="space-y-4">
                <div>
                  <label className="form-label">Full Name / Business Name</label>
                  <input className="form-input" name="name" value={profileForm.name} onChange={handleProfileChange} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Mobile Number</label>
                    <input className="form-input" name="mobile" value={profileForm.mobile} onChange={handleProfileChange} required />
                  </div>
                  <div>
                    <label className="form-label">Business Name (optional)</label>
                    <input className="form-input" name="businessName" value={profileForm.businessName} onChange={handleProfileChange} placeholder="e.g. Om Traders" />
                  </div>
                </div>
                <div>
                  <label className="form-label">Business Address</label>
                  <input className="form-input" name="address" value={profileForm.address} onChange={handleProfileChange} required />
                </div>
                <button className="btn-primary" type="submit" disabled={profileLoading}>
                  <Save size={15} /> {profileLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>

            <div className="card">
              <h2 className="mb-4 text-base font-semibold text-slate-900">Change Password</h2>
              {passwordMsg.text && <div className={msgClass(passwordMsg.type)}>{passwordMsg.text}</div>}
              <form onSubmit={changePassword} className="space-y-4">
                <div>
                  <label className="form-label">Current Password</label>
                  <input className="form-input" type="password" name="currentPassword" value={passwordForm.currentPassword} onChange={handlePasswordChange} placeholder="Enter current password" required />
                </div>
                <div>
                  <label className="form-label">New Password</label>
                  <input className="form-input" type="password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordChange} placeholder="Min 6 characters" required />
                </div>
                <div>
                  <label className="form-label">Confirm New Password</label>
                  <input className="form-input" type="password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordChange} placeholder="Repeat new password" required />
                </div>
                <button className="btn-primary" type="submit" disabled={passwordLoading}>
                  <KeyRound size={15} /> {passwordLoading ? 'Updating...' : 'Change Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
