import { cookies } from 'next/headers';
import Link from 'next/link';
import TransactionFilters from './TransactionFilters';

async function getPortfolioDetails(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('jwt')?.value;
  if (!token) return null;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/portfolios/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data;
}

async function getCategories(portfolioId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('jwt')?.value;
  if (!token) return [];

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/categories?portfolio_id=${portfolioId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

async function getTransactions(portfolioId: string, searchParams: any) {
  const cookieStore = await cookies();
  const token = cookieStore.get('jwt')?.value;
  if (!token) return [];

  const params = new URLSearchParams(searchParams);
  
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/portfolios/${portfolioId}/transactions?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export default async function TransactionsPage({ params, searchParams }: { params: { id: string }, searchParams: any }) {
  const portfolio = await getPortfolioDetails(params.id);
  const categories = await getCategories(params.id);
  
  // Await searchParams in Next.js 15 App Router? Actually Next 15 searchParams is a Promise. Let's await it to be safe.
  const resolvedSearchParams = await searchParams;
  const transactions = await getTransactions(params.id, resolvedSearchParams);

  if (!portfolio) {
    return <div>Portofolio tidak ditemukan.</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/dashboard/portfolios" style={{ fontSize: '1.5rem', textDecoration: 'none', color: 'var(--text-muted)' }}>
          ←
        </Link>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>{portfolio.name}</h1>
          <p style={{ color: 'var(--text-muted)' }}>Saldo: <strong style={{ color: 'var(--primary)' }}>Rp {portfolio.balance.toLocaleString('id-ID')}</strong></p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Riwayat Transaksi</h2>
        <Link href={`/dashboard/portfolios/${portfolio.id}/transactions/new`} className="btn btn-primary">
          + Catat Transaksi
        </Link>
      </div>

      <TransactionFilters categories={categories} />

      <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '1rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        {transactions.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Tidak ada transaksi yang cocok dengan filter.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', backgroundColor: 'var(--bg-color)' }}>
                <th style={{ padding: '1rem' }}>Tanggal</th>
                <th style={{ padding: '1rem' }}>Deskripsi</th>
                <th style={{ padding: '1rem' }}>Kategori</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Jumlah</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t: any) => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                    {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{t.description || '-'}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{t.category?.name || '-'}</td>
                  <td style={{ 
                    padding: '1rem', 
                    textAlign: 'right', 
                    fontWeight: 700,
                    color: t.type === 'income' ? 'var(--success, #10b981)' : 'var(--danger, #ef4444)'
                  }}>
                    {t.type === 'income' ? '+' : '-'} Rp {t.amount.toLocaleString('id-ID')}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <Link href={`/dashboard/portfolios/${portfolio.id}/transactions/${t.id}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
