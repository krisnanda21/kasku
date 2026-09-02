'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { loginAction } from '@/app/actions/auth';
import styles from '../auth.module.css';

const initialState = {
  error: '',
};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <div className={styles.container}>
      <div className={styles.authCard}>
        <h1 className={styles.title}>Masuk ke KasKu</h1>
        <p className={styles.subtitle}>Kelola keuanganmu dengan lebih pintar</p>
        
        <form action={formAction}>
          {state?.error && <div className={styles.errorMsg}>{state.error}</div>}
          
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
            {isPending ? 'Memproses...' : 'Masuk'}
          </button>

          <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', textAlign: 'center' }}>
            <hr style={{ flex: 1, borderColor: 'var(--border-color)', opacity: 0.5 }} />
            <span style={{ padding: '0 1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>atau</span>
            <hr style={{ flex: 1, borderColor: 'var(--border-color)', opacity: 0.5 }} />
          </div>

          <a 
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/auth/google/login`}
            className={`btn btn-secondary ${styles.submitBtn}`}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem',
              textDecoration: 'none'
            }}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '1.25rem', height: '1.25rem' }} />
            Lanjutkan dengan Google
          </a>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          Belum punya akun? <Link href="/register" className={styles.link}>Daftar sekarang</Link>
        </p>
      </div>
    </div>
  );
}
