'use client';

import React, { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { Camera, X, Loader2 } from 'lucide-react';
import { updateProfile, updatePassword } from '@/app/actions/auth';
import styles from './ProfileModal.module.css';

interface UserData {
  name: string;
  email: string;
  avatar?: string;
  google_id?: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData;
  onUpdate: (data: Partial<UserData>) => void;
}

export default function ProfileModal({ isOpen, onClose, user, onUpdate }: ProfileModalProps) {
  const [name, setName] = useState(user.name || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setError('Format file harus .png, .jpg, atau .jpeg');
      return;
    }

    if (file.size > 1024 * 1024) {
      setError('Ukuran file maksimal 1MB');
      return;
    }

    setIsUploading(true);
    setError('');
    
    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 500,
        useWebWorker: true
      };
      
      const compressedFile = await imageCompression(file, options);
      
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setAvatar(base64data);
        setIsUploading(false);
      };
    } catch (err) {
      setError('Gagal memproses gambar');
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setError('');
    setSuccessMsg('');

    const res = await updateProfile({ name, avatar });
    if (res.error) {
      setError(res.error);
    } else {
      setSuccessMsg('Profil berhasil diperbarui');
      onUpdate({ name, avatar });
      setTimeout(() => setSuccessMsg(''), 3000);
    }
    setIsSaving(false);
  };

  const handleSavePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi password tidak cocok');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password baru minimal 6 karakter');
      return;
    }

    setIsSavingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');

    const res = await updatePassword({ old_password: oldPassword, new_password: newPassword });
    if (res.error) {
      setPasswordError(res.error);
    } else {
      setPasswordSuccess('Password berhasil diperbarui');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordSuccess('');
        setShowPasswordSection(false);
      }, 3000);
    }
    setIsSavingPassword(false);
  };

  const getInitial = (nameStr: string) => {
    if (!nameStr) return 'U';
    return nameStr.charAt(0).toUpperCase();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Profil Pengguna</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {error && <div className={styles.alertError}>{error}</div>}
          {successMsg && <div className={styles.alertSuccess}>{successMsg}</div>}

          <div className={styles.avatarSection}>
            <div className={styles.avatarWrapper}>
              {avatar ? (
                <img src={avatar} alt="Avatar" className={styles.avatarImage} />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {getInitial(name || user.name)}
                </div>
              )}
              <button 
                className={styles.uploadBtn}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept=".jpg,.jpeg,.png"
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Email (Tidak dapat diubah)</label>
            <input type="email" value={user.email} disabled className={styles.inputDisabled} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Nama</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className={styles.input} 
            />
          </div>

          <button 
            className={styles.saveBtn} 
            onClick={handleSaveProfile}
            disabled={isSaving}
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Profil'}
          </button>

          {!user.google_id && (
            <div className={styles.passwordSection}>
              <div 
                className={styles.passwordHeader}
                onClick={() => setShowPasswordSection(!showPasswordSection)}
              >
                <h3>Ubah Password</h3>
                <span>{showPasswordSection ? '▲' : '▼'}</span>
              </div>
              
              {showPasswordSection && (
                <div className={styles.passwordBody}>
                  {passwordError && <div className={styles.alertError}>{passwordError}</div>}
                  {passwordSuccess && <div className={styles.alertSuccess}>{passwordSuccess}</div>}
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Password Lama</label>
                    <input 
                      type="password" 
                      value={oldPassword} 
                      onChange={(e) => setOldPassword(e.target.value)} 
                      className={styles.input} 
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Password Baru</label>
                    <input 
                      type="password" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      className={styles.input} 
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Konfirmasi Password Baru</label>
                    <input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      className={styles.input} 
                    />
                  </div>
                  
                  <button 
                    className={styles.saveBtn} 
                    onClick={handleSavePassword}
                    disabled={isSavingPassword || !oldPassword || !newPassword || !confirmPassword}
                  >
                    {isSavingPassword ? 'Menyimpan...' : 'Simpan Password'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
