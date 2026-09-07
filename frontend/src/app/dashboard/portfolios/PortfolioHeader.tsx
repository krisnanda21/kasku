'use client';

import { useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import PortfolioForm from './PortfolioForm';

export default function PortfolioHeader() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', paddingRight: '14rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Manajemen Portofolio</h1>
          <p style={{ color: 'var(--text-muted)' }}>Kelola kas, tabungan, dan dompet Anda</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          + Portofolio Baru
        </button>
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
              <PortfolioForm 
                isModal={true} 
                onSuccess={() => {
                  startTransition(() => {
                    setIsModalOpen(false);
                    router.refresh();
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
