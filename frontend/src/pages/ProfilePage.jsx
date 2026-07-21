import React, { useState } from 'react';
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
      setProfileMsg({ text: '✅ Profile updated successfully!', type: 'success' });
    } catch (err) {
      setProfileMsg({ text: '⚠️ ' + (err.response?.data?.message || 'Update failed'), type: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ text: '', type: '' });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return setPasswordMsg({ text: '⚠️ New passwords do not match', type: 'error' });
    }
    if (passwordForm.newPassword.length < 6) {
      return setPasswordMsg({ text: '⚠️ Password must be at least 6 characters', type: 'error' });
    }

    setPasswordLoading(true);
    try {
      await API.put('/profile/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordMsg({ text: '✅ Password changed successfully!', type: 'success' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordMsg({ text: '⚠️ ' + (err.response?.data?.message || 'Failed to change password'), type: 'error' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const avatarLetter = user?.name?.charAt(0).toUpperCase() || 'G';

  const msgStyle = (type) => ({
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '16px',
    background: type === 'success' ? '#dcfce7' : '#fef2f2',
    color: type === 'success' ? '#15803d' : '#ef4444',
  });

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <h1 className="page-title">👤 My Profile</h1>

        <div className="profile-grid">
          {/* Left: Avatar Card */}
          <div>
            <div className="card profile-avatar-card">
              <div className="profile-avatar">{avatarLetter}</div>
              <div className="profile-name">{user?.name}</div>
              <div className="profile-type">{user?.type}</div>
              <div style={{ marginTop: '20px', textAlign: 'left', width: '100%' }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', display: 'flex', gap: '8px' }}>
                  <span>📧</span><span>{user?.email}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', display: 'flex', gap: '8px' }}>
                  <span>📱</span><span>{user?.mobile}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', gap: '8px' }}>
                  <span>📍</span><span>{user?.address}</span>
                </div>
              </div>
            </div>

            {/* Account info card */}
            <div className="card" style={{ marginTop: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Account Info</h3>
              <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '2' }}>
                <div><strong>Account Type:</strong> {user?.type}</div>
                <div><strong>Email:</strong> {user?.email}</div>
                <div><strong>Member since:</strong> {new Date().getFullYear()}</div>
              </div>
            </div>
          </div>

          {/* Right: Edit Forms */}
          <div>
            {/* Edit Profile */}
            <div className="card" style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '20px' }}>Edit Profile</h2>
              {profileMsg.text && <div style={msgStyle(profileMsg.type)}>{profileMsg.text}</div>}
              <form onSubmit={saveProfile}>
                <div className="form-group">
                  <label>Full Name / Business Name</label>
                  <input name="name" value={profileForm.name} onChange={handleProfileChange} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Mobile Number</label>
                    <input name="mobile" value={profileForm.mobile} onChange={handleProfileChange} required />
                  </div>
                  <div className="form-group">
                    <label>Business Name (optional)</label>
                    <input name="businessName" value={profileForm.businessName} onChange={handleProfileChange} placeholder="e.g. Om Traders" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Business Address</label>
                  <input name="address" value={profileForm.address} onChange={handleProfileChange} required />
                </div>
                <button className="btn btn-primary" type="submit" disabled={profileLoading}>
                  {profileLoading ? 'Saving...' : '💾 Save Changes'}
                </button>
              </form>
            </div>

            {/* Change Password */}
            <div className="card">
              <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '20px' }}>🔒 Change Password</h2>
              {passwordMsg.text && <div style={msgStyle(passwordMsg.type)}>{passwordMsg.text}</div>}
              <form onSubmit={changePassword}>
                <div className="form-group">
                  <label>Current Password</label>
                  <input type="password" name="currentPassword" value={passwordForm.currentPassword} onChange={handlePasswordChange} placeholder="Enter current password" required />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input type="password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordChange} placeholder="Min 6 characters" required />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input type="password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordChange} placeholder="Repeat new password" required />
                </div>
                <button className="btn btn-primary" type="submit" disabled={passwordLoading}>
                  {passwordLoading ? 'Updating...' : '🔑 Change Password'}
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
