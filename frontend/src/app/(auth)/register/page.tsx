'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { registerAction } from '@/app/actions/auth';
import styles from '../auth.module.css';

const initialState = {
  error: '',
};

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);

  return (
    <div className={styles.container}>
      <div className={styles.authCard}>
        <h1 className={styles.title}>Daftar KasKu</h1>
        <p className={styles.subtitle}>Mulai kelola keuanganmu hari ini</p>
        
        <form action={formAction}>
          {state?.error && <div className={styles.errorMsg}>{state.error}</div>}
          
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>Nama Lengkap</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              className={styles.input} 
              placeholder="Budi Santoso" 
              required 
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              className={styles.input} 
              placeholder="nama@email.com" 
              required 
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              className={styles.input} 
              placeholder="••••••••" 
              required 
            />
          </div>
          
          <button 
            type="submit" 
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={isPending}
          >
            {isPending ? 'Memproses...' : 'Daftar Sekarang'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          Sudah punya akun? <Link href="/login" className={styles.link}>Masuk di sini</Link>
        </p>
      </div>
    </div>
  );
}
