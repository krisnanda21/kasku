'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function TransactionPagination({ meta }: { meta: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (!meta) return null;

  const currentPage = meta.page || 1;
  const currentLimit = meta.limit || 10;
  const totalPages = meta.total_pages || 1;

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('limit', e.target.value);
    params.set('page', '1'); // Reset to page 1 on limit change
    router.push(`?${params.toString()}`);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        <span>Tampilkan</span>
        <select 
          value={currentLimit} 
          onChange={handleLimitChange}
          style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}
        >
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
        <span>data per halaman</span>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', backgroundColor: currentPage <= 1 ? 'var(--bg-color)' : 'var(--card-bg)', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer', color: currentPage <= 1 ? 'var(--text-muted)' : 'inherit' }}
        >
          Sebelumnya
        </button>
        <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', fontSize: '0.875rem' }}>
          Halaman {currentPage} dari {totalPages}
        </span>
        <button 
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', backgroundColor: currentPage >= totalPages ? 'var(--bg-color)' : 'var(--card-bg)', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', color: currentPage >= totalPages ? 'var(--text-muted)' : 'inherit' }}
        >
          Berikutnya
        </button>
      </div>
    </div>
  );
}
