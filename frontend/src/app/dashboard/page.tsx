import { cookies } from 'next/headers';
import styles from './page.module.css';
import Link from 'next/link';

async function getPortfolios() {
  const cookieStore = await cookies();
  const token = cookieStore.get('jwt')?.value;

  if (!token) return [];

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/portfolios`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    // Don't cache for dynamic dashboard data
    cache: 'no-store'
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export default async function DashboardOverview() {
  const portfolios = await getPortfolios();

  return (
    <div>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Selamat Datang! 👋</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Berikut adalah ringkasan keuangan Anda hari ini.</p>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Total Saldo</h3>
          <p className={styles.statValue}>
            Rp {portfolios.reduce((acc: any, curr: any) => acc + curr.balance, 0).toLocaleString('id-ID')}
          </p>
        </div>
        <div className={styles.statCard}>
          <h3>Portofolio Aktif</h3>
          <p className={styles.statValue}>{portfolios.length}</p>
        </div>
      </div>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '2.5rem', marginBottom: '1rem' }}>
        Portofolio Anda
      </h2>

      {portfolios.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Anda belum memiliki portofolio.</p>
          <Link href="/dashboard/portfolios/new" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Buat Portofolio Baru</Link>
        </div>
      ) : (
        <div className={styles.portfolioList}>
          {portfolios.map((p: any) => (
            <div key={p.id} className={styles.portfolioCard}>
              <h4>{p.name}</h4>
              <p className={styles.portfolioBalance}>Rp {p.balance.toLocaleString('id-ID')}</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{p.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

