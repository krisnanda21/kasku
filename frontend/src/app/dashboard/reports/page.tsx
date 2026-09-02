import { cookies } from 'next/headers';
import Link from 'next/link';

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

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Laporan & Ekspor</h1>
        <p style={{ color: 'var(--text-muted)' }}>Unduh riwayat transaksi portofolio Anda dalam format PDF atau Excel.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {portfolios.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', backgroundColor: 'var(--card-bg)', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
            Anda belum memiliki portofolio.
          </div>
        ) : (
          portfolios.map((p: any) => (
            <div key={p.id} style={{
              backgroundColor: 'var(--card-bg)',
              padding: '1.5rem',
              borderRadius: '1rem',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{p.name}</h3>
                <p style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.25rem' }}>Rp {p.balance.toLocaleString('id-ID')}</p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <a 
                  href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/portfolios/${p.id}/export/pdf`} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary" 
                  style={{ flex: 1, textAlign: 'center', padding: '0.5rem 0' }}
                >
                  📄 PDF
                </a>
                <a 
                  href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/portfolios/${p.id}/export/excel`} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary" 
                  style={{ flex: 1, textAlign: 'center', padding: '0.5rem 0', backgroundColor: '#10b981', color: 'white', borderColor: '#10b981' }}
                >
                  📊 Excel
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
