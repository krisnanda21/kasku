'use client';

import { useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import TransactionForm from './new/TransactionForm';

export default function TransactionHeader({ portfolioId, categories, role }: { portfolioId: string, categories: any[], role: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Riwayat Transaksi</h2>
        {role !== 'view' && (
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            + Catat Transaksi
          </button>
        )}
      </div>

      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 50,
          padding: '1rem',
        }}>
          <div style={{
            backgroundColor: 'var(--card-bg)',
            borderRadius: '1rem',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: 'var(--text-muted)'
              }}
            >
              &times;
            </button>
            <div style={{ padding: '2rem' }}>
              <TransactionForm 
                portfolioId={portfolioId} 
                categories={categories} 
                isModal={true} 
                onSuccess={() => {
                  startTransition(() => {
                    router.refresh();
                    setIsModalOpen(false);
                  });
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
