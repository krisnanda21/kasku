'use client';

import { useActionState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { loginAction } from '@/app/actions/auth';
import styles from '../auth.module.css';

import Image from 'next/image';

const initialState = {
  error: '',
};

function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '';

  return (
    <div className={styles.container}>
      <div className={styles.authCard}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', }}>
          <Image
            src="/1_logo_login.svg"
            alt="KasKu Logo"
            width={120}
            height={120}
            priority
            style={{
              borderRadius: '28px',
              filter: `
                drop-shadow(0 12px 20px rgba(0, 0, 0, 0.18))
                drop-shadow(0 4px 6px rgba(0, 0, 0, 0.08))
              `,
              transform: 'translateY(-2px)',
            }}
          />
        </div>
        <h1 className={styles.title}>Masuk ke KasKu</h1>
        <p className={styles.subtitle}>Kelola keuanganmu dengan lebih pintar</p>

        <form action={formAction}>
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
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
            href={`/api/auth/google/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`}
            className={`btn btn-outline ${styles.submitBtn}`}
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
          Belum punya akun? <Link href={`/register${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`} className={styles.link}>Daftar sekarang</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
