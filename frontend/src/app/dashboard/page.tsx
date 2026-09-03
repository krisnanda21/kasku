import { cookies } from 'next/headers';
import DashboardClient from './DashboardClient';

async function getPortfolios() {
  const cookieStore = await cookies();
  const token = cookieStore.get('jwt')?.value;

  if (!token) return { portfolios: [], token: '' };

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/portfolios`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    // Don't cache for dynamic dashboard data
    cache: 'no-store'
  });

  if (!res.ok) return { portfolios: [], token };
  const data = await res.json();
  return { portfolios: data.data || [], token };
}

export default async function DashboardOverview() {
  const { portfolios, token } = await getPortfolios();

  return (
    <div>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Selamat Datang! 👋</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Berikut adalah ringkasan keuangan Anda.</p>

      <DashboardClient portfolios={portfolios} token={token} />
    </div>
  );
}

