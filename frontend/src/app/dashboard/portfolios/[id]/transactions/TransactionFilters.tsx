'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function TransactionFilters({ categories }: { categories: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [startDate, setStartDate] = useState(searchParams.get('start_date') || '');
  const [endDate, setEndDate] = useState(searchParams.get('end_date') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('category_id') || '');
  const [type, setType] = useState(searchParams.get('type') || '');

  const applyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    if (categoryId) params.set('category_id', categoryId);
    if (type) params.set('type', type);

    router.push(`?${params.toString()}`);
  };

  const clearFilter = () => {
    setStartDate('');
    setEndDate('');
    setCategoryId('');
    setType('');
    router.push(`?`);
  };

  return (
    <form onSubmit={applyFilter} style={{
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: '1rem', 
      alignItems: 'end',
      backgroundColor: 'var(--card-bg)',
      padding: '1.5rem',
      borderRadius: '1rem',
      border: '1px solid var(--border-color)',
      marginBottom: '1.5rem'
    }}>
      <div style={{ flex: 1, minWidth: '150px' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>Mulai Tanggal</label>
        <input 
          type="date" 
          value={startDate} 
          onChange={e => setStartDate(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}
        />
      </div>
      <div style={{ flex: 1, minWidth: '150px' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>Sampai Tanggal</label>
        <input 
          type="date" 
          value={endDate} 
          onChange={e => setEndDate(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}
        />
      </div>
      <div style={{ flex: 1, minWidth: '150px' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>Tipe</label>
        <select 
          value={type} 
          onChange={e => setType(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}
        >
          <option value="">Semua Tipe</option>
          <option value="income">Pemasukan</option>
          <option value="expense">Pengeluaran</option>
        </select>
      </div>
      <div style={{ flex: 1, minWidth: '150px' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>Kategori</label>
        <select 
          value={categoryId} 
          onChange={e => setCategoryId(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}
        >
          <option value="">Semua Kategori</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Filter</button>
        <button type="button" onClick={clearFilter} className="btn" style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--bg-color)' }}>Reset</button>
      </div>
    </form>
  );
}
