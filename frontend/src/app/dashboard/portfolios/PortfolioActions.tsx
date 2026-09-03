'use client';

import { useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import PortfolioForm from './PortfolioForm';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { deletePortfolioAction } from '@/app/actions/portfolio';

export default function PortfolioActions({ portfolio }: { portfolio: any }) {
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deletePortfolioAction(portfolio.id);
    setIsDeleting(false);
    
    if (result.success) {
      setIsDeleteModalOpen(false);
      startTransition(() => {
        router.push('/dashboard/portfolios');
        router.refresh();
      });
    } else {
      alert(result.error || 'Gagal menghapus portofolio');
    }
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button 
          onClick={() => setIsEditModalOpen(true)}
          className="btn"
          style={{ flex: 1, padding: '0.5rem', backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
        >
          Edit
        </button>
        <button 
          onClick={() => setIsDeleteModalOpen(true)}
          className="btn"
          style={{ flex: 1, padding: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)' }}
        >
          Hapus
        </button>
      </div>

      {isEditModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 50, padding: '1rem',
        }}>
          <div style={{
            backgroundColor: 'var(--card-bg)',
            borderRadius: '1rem', width: '100%', maxWidth: '600px',
            maxHeight: '90vh', overflowY: 'auto', position: 'relative'
          }}>
            <button 
              onClick={() => setIsEditModalOpen(false)}
              style={{
                position: 'absolute', top: '1.5rem', right: '1.5rem',
                background: 'none', border: 'none', fontSize: '1.5rem',
                cursor: 'pointer', color: 'var(--text-muted)'
              }}
            >
              &times;
            </button>
            <div style={{ padding: '2rem' }}>
              <PortfolioForm 
                isModal={true} 
                initialData={portfolio}
                onSuccess={() => {
                  startTransition(() => {
                    router.refresh();
                    setIsEditModalOpen(false);
                  });
                }}
              />
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Hapus Portofolio?"
        message={`Apakah Anda yakin ingin menghapus portofolio "${portfolio.name}"? Semua transaksi di dalamnya juga akan terhapus secara permanen.`}
        confirmText="Ya, Hapus"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </>
  );
}
