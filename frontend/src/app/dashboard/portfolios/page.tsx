import { cookies } from 'next/headers';
import Link from 'next/link';
import PortfolioHeader from './PortfolioHeader';

async function getPortfolios() {
  const cookieStore = await cookies();
  const token = cookieStore.get('jwt')?.value;

  if (!token) return [];

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/portfolios`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export default async function PortfoliosPage() {
  const portfolios = await getPortfolios();

  return (
    <div>
      <PortfolioHeader />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {portfolios.map((p: any) => (
          <div key={p.id} style={{
            backgroundColor: 'var(--card-bg)',
            padding: '1.5rem',
            borderRadius: '1rem',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>{p.name}</h3>
            <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)', margin: '1rem 0' }}>
              Rp {p.balance.toLocaleString('id-ID')}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              {p.description || 'Tidak ada deskripsi'}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link href={`/dashboard/portfolios/${p.id}/transactions`} className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', padding: '0.5rem' }}>
                Lihat Transaksi
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
