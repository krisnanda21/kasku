'use client';

import { useActionState, useState } from 'react';
import { createTransactionAction } from '@/app/actions/transaction';
import Link from 'next/link';

export default function TransactionForm({ portfolioId, categories }: { portfolioId: string, categories: any[] }) {
  const [state, formAction, isPending] = useActionState(createTransactionAction, { error: '' });
  const [type, setType] = useState('expense');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [displayAmount, setDisplayAmount] = useState('');

  // Set default date to today in YYYY-MM-DD format for input[type="date"]
  const today = new Date().toISOString().split('T')[0];

  const filteredCategories = categories.filter(c => c.type === type);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      setDisplayAmount('');
      return;
    }
    const formatted = new Intl.NumberFormat('id-ID').format(Number(rawValue));
    setDisplayAmount(formatted);
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href={`/dashboard/portfolios/${portfolioId}/transactions`} style={{ fontSize: '1.5rem', textDecoration: 'none', color: 'var(--text-muted)' }}>
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
          <input type="hidden" name="portfolio_id" value={portfolioId} />

          {state?.error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem' }}>{state.error}</div>}
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Jenis Transaksi</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="type" value="income" checked={type === 'income'} onChange={() => { setType('income'); setIsCustomCategory(false); }} />
                Pemasukan (+)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="type" value="expense" checked={type === 'expense'} onChange={() => { setType('expense'); setIsCustomCategory(false); }} />
                Pengeluaran (-)
              </label>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="date" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Tanggal Transaksi</label>
            <input 
              type="date" 
              id="date" 
              name="date" 
              defaultValue={today}
              onClick={(e) => (e.target as HTMLInputElement).showPicker()}
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
            <label htmlFor="category_id" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Kategori</label>
            <select 
              id="category_id" 
              name="category_id" 
              required 
              onChange={(e) => setIsCustomCategory(e.target.value === 'custom')}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-main)',
              }}
            >
              <option value="">-- Pilih Kategori --</option>
              {filteredCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              <option value="custom">+ Tambah Kategori Baru</option>
            </select>
          </div>

          {isCustomCategory && (
            <div style={{ marginBottom: '1.5rem', marginTop: '-0.5rem' }}>
              <input 
                type="text" 
                name="custom_category_name" 
                placeholder="Nama Kategori Baru" 
                required 
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--primary)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-main)',
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="amount" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Jumlah (Rp)</label>
            <input 
              type="text" 
              id="amount" 
              name="amount" 
              placeholder="Contoh: 50.000" 
              value={displayAmount}
              onChange={handleAmountChange}
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
