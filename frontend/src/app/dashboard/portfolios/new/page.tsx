'use client';

import { useActionState } from 'react';
import { createPortfolioAction } from '@/app/actions/portfolio';
import Link from 'next/link';

export default function NewPortfolioPage() {
  const [state, formAction, isPending] = useActionState(createPortfolioAction, { error: '' });

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/dashboard/portfolios" style={{ fontSize: '1.5rem', textDecoration: 'none', color: 'var(--text-muted)' }}>
          ←
        </Link>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Buat Portofolio Baru</h1>
      </div>

      <div style={{
        backgroundColor: 'var(--card-bg)',
        padding: '2rem',
        borderRadius: '1rem',
        border: '1px solid var(--border-color)'
      }}>
        <form action={formAction}>
          {state?.error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{state.error}</div>}
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Nama Portofolio</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              placeholder="Contoh: Dompet Utama, Tabungan Nikah" 
              required 
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-main)',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Deskripsi (Opsional)</label>
            <textarea 
              id="description" 
              name="description" 
              rows={3}
              placeholder="Catatan kecil untuk portofolio ini..." 
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-main)',
                resize: 'vertical'
              }}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isPending}
            style={{ width: '100%' }}
          >
            {isPending ? 'Menyimpan...' : 'Simpan Portofolio'}
          </button>
        </form>
      </div>
    </div>
  );
}
