'use client';

import { useActionState } from 'react';
import { createTransactionAction } from '@/app/actions/transaction';
import Link from 'next/link';

export default function NewTransactionPage({ params }: { params: { id: string } }) {
  const [state, formAction, isPending] = useActionState(createTransactionAction, { error: '' });

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href={`/dashboard/portfolios/${params.id}/transactions`} style={{ fontSize: '1.5rem', textDecoration: 'none', color: 'var(--text-muted)' }}>
          ←
        </Link>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Catat Transaksi Baru</h1>
      </div>

      <div style={{
        backgroundColor: 'var(--card-bg)',
        padding: '2rem',
        borderRadius: '1rem',
        border: '1px solid var(--border-color)'
      }}>
        <form action={formAction}>
          {/* Hidden input to pass portfolio ID */}
          <input type="hidden" name="portfolio_id" value={params.id} />

          {state?.error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{state.error}</div>}
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Jenis Transaksi</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="type" value="income" defaultChecked />
                Pemasukan (+)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="type" value="expense" />
                Pengeluaran (-)
              </label>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="amount" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Jumlah (Rp)</label>
            <input 
              type="number" 
              id="amount" 
              name="amount" 
              placeholder="Contoh: 50000" 
              min="1"
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
              placeholder="Contoh: Beli makan siang, Gaji bulanan..." 
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
            {isPending ? 'Menyimpan...' : 'Simpan Transaksi'}
          </button>
        </form>
      </div>
    </div>
  );
}
