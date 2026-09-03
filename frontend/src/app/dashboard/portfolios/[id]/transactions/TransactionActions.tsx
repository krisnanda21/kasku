'use client';

import { useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import TransactionForm from './new/TransactionForm';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { deleteTransactionAction } from '@/app/actions/transaction';

export default function TransactionActions({ 
  transaction, 
  portfolioId, 
  categories,
  role
}: { 
  transaction: any, 
  portfolioId: string, 
  categories: any[],
  role: string
}) {
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (role === 'view') {
    return <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>-</span>;
  }

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteTransactionAction(transaction.id, portfolioId);
    setIsDeleting(false);
    
    if (result.success) {
      setIsDeleteModalOpen(false);
      startTransition(() => {
        router.refresh();
      });
    } else {
      alert(result.error || 'Gagal menghapus transaksi');
    }
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
        <button 
          onClick={() => setIsEditModalOpen(true)}
          className="btn"
          style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
        >
          Edit
        </button>
        <button 
          onClick={() => setIsDeleteModalOpen(true)}
          className="btn"
          style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)' }}
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
              <TransactionForm 
                portfolioId={portfolioId}
                categories={categories}
                isModal={true} 
                initialData={transaction}
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
        title="Hapus Transaksi?"
        message={`Apakah Anda yakin ingin menghapus transaksi ini? Saldo portofolio akan disesuaikan kembali.`}
        confirmText="Ya, Hapus"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </>
  );
}
