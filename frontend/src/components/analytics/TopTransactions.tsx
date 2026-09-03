'use client';

type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: string;
  date: string;
  category: {
    name: string;
  };
};

type TopTransactionsProps = {
  data: Transaction[];
  isLoading?: boolean;
};

export default function TopTransactions({ data, isLoading }: TopTransactionsProps) {
  return (
    <div style={{
      backgroundColor: 'var(--card-bg)',
      padding: '1.5rem',
      borderRadius: '1rem',
      border: '1px solid var(--border-color)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Top 5 Transaksi Terbesar</h3>
      
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ height: '50px', backgroundColor: 'var(--border-color)', borderRadius: '0.5rem', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
          Belum ada transaksi.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {data.map((tx, idx) => {
            const isIncome = tx.type === 'income';
            return (
              <div key={tx.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    color: 'var(--text-muted)'
                  }}>
                    {idx + 1}
                  </div>
                  <div>
                    <p style={{ fontWeight: 500, margin: 0 }}>{tx.category?.name || 'Uncategorized'}</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>{new Date(tx.date).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
                <div style={{ 
                  fontWeight: 600, 
                  color: isIncome ? 'var(--success)' : 'var(--danger)' 
                }}>
                  {isIncome ? '+' : '-'}Rp {tx.amount.toLocaleString('id-ID')}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
