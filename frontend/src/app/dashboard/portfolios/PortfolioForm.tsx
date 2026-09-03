'use client';

import { useActionState, useEffect, useState, startTransition } from 'react';
import { createPortfolioAction, updatePortfolioAction } from '@/app/actions/portfolio';
import Link from 'next/link';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function PortfolioForm({ 
  isModal = false, 
  onSuccess,
  initialData 
}: { 
  isModal?: boolean, 
  onSuccess?: () => void,
  initialData?: any
}) {
  const isEdit = !!initialData;
  const actionToUse = isEdit ? updatePortfolioAction.bind(null, initialData.id) : createPortfolioAction;
  
  const [state, formAction, isPending] = useActionState(actionToUse as any, { error: '' } as any);
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);

  useEffect(() => {
    if (state?.success && onSuccess) {
      onSuccess();
    }
  }, [state, onSuccess]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (isEdit) {
      e.preventDefault();
      setPendingFormData(new FormData(e.currentTarget));
      setShowConfirm(true);
    }
  };

  const confirmSave = () => {
    if (pendingFormData) {
      startTransition(() => {
        (formAction as any)(pendingFormData);
      });
    }
    setShowConfirm(false);
  };

  return (
    <div style={isModal ? {} : { maxWidth: '600px' }}>
      {!isModal && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <Link href="/dashboard/portfolios" style={{ fontSize: '1.5rem', textDecoration: 'none', color: 'var(--text-muted)' }}>
            ←
          </Link>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>{isEdit ? 'Edit Portofolio' : 'Buat Portofolio Baru'}</h1>
        </div>
      )}
      {isModal && (
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', marginTop: '-0.5rem' }}>
          {isEdit ? 'Edit Portofolio' : 'Buat Portofolio Baru'}
        </h2>
      )}

      <div style={isModal ? {} : {
        backgroundColor: 'var(--card-bg)',
        padding: '2rem',
        borderRadius: '1rem',
        border: '1px solid var(--border-color)'
      }}>
        <form action={formAction} onSubmit={handleSubmit}>
          {state?.error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem' }}>{state.error}</div>}
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Nama Portofolio</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              placeholder="Contoh: Dompet Utama, Tabungan Nikah" 
              required 
              defaultValue={initialData?.name || ''}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-main)',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Deskripsi (Opsional)</label>
            <textarea 
              id="description" 
              name="description" 
              rows={3}
              placeholder="Catatan kecil untuk portofolio ini..." 
              defaultValue={initialData?.description || ''}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-main)',
                resize: 'vertical'
              }}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isPending}
            style={{ width: '100%' }}
          >
            {isPending ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Simpan Portofolio')}
          </button>
        </form>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title="Simpan Perubahan?"
        message="Apakah Anda yakin ingin menyimpan perubahan pada portofolio ini?"
        confirmText="Simpan"
        onConfirm={confirmSave}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
