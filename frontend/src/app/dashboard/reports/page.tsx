import { cookies } from 'next/headers';
import ReportsClient from './ReportsClient';

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

export default async function ReportsPage() {
  const portfolios = await getPortfolios();
  const cookieStore = await cookies();
  const token = cookieStore.get('jwt')?.value || '';

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Laporan & Ekspor</h1>
        <p style={{ color: 'var(--text-muted)' }}>Unduh riwayat transaksi portofolio Anda dalam format PDF atau Excel.</p>
      </div>

      <ReportsClient portfolios={portfolios} token={token} />
    </div>
  );
}
