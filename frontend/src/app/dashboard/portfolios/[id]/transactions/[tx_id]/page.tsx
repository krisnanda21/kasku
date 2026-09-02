import { cookies } from 'next/headers';
import Link from 'next/link';

async function getTransactionDetail(portfolioId: string, txId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('jwt')?.value;
  if (!token) return null;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/portfolios/${portfolioId}/transactions/${txId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data;
}

async function getTransactionLogs(portfolioId: string, txId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('jwt')?.value;
  if (!token) return [];

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/portfolios/${portfolioId}/transactions/${txId}/logs`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export default async function TransactionDetailPage({ params }: { params: { id: string, tx_id: string } }) {
  const transaction = await getTransactionDetail(params.id, params.tx_id);
  const logs = await getTransactionLogs(params.id, params.tx_id);

  if (!transaction) {
    return <div>Transaksi tidak ditemukan.</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href={`/dashboard/portfolios/${params.id}/transactions`} style={{ fontSize: '1.5rem', textDecoration: 'none', color: 'var(--text-muted)' }}>
          ←
        </Link>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Detail Transaksi</h1>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', backgroundColor: 'var(--card-bg)', padding: '2rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Informasi Transaksi</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ color: 'var(--text-muted)' }}>Tanggal</div>
            <div style={{ fontWeight: 500 }}>{new Date(transaction.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            
            <div style={{ color: 'var(--text-muted)' }}>Jenis</div>
            <div style={{ fontWeight: 700, color: transaction.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
              {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
            </div>
            
            <div style={{ color: 'var(--text-muted)' }}>Kategori</div>
            <div style={{ fontWeight: 500 }}>{transaction.category?.name || '-'}</div>
            
            <div style={{ color: 'var(--text-muted)' }}>Jumlah</div>
            <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>Rp {transaction.amount.toLocaleString('id-ID')}</div>
            
            <div style={{ color: 'var(--text-muted)' }}>Deskripsi</div>
            <div style={{ fontWeight: 500 }}>{transaction.description || '-'}</div>
          </div>
        </div>

        <div style={{ flex: '1 1 300px', backgroundColor: 'var(--card-bg)', padding: '2rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Riwayat Perubahan (Audit Log)</h2>
          
          {logs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Belum ada riwayat perubahan.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {logs.map((log: any) => (
                <div key={log.id} style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    {new Date(log.created_at).toLocaleString('id-ID')}
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                    Aksi: <span style={{ textTransform: 'uppercase' }}>{log.action}</span>
                  </div>
                  <div style={{ fontSize: '0.875rem' }}>
                    Oleh: {log.user?.name || log.user?.email || log.changed_by}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
