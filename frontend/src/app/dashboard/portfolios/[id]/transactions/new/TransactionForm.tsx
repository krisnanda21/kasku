'use client';

import { useActionState, useState, useEffect, startTransition } from 'react';
import { createTransactionAction, updateTransactionAction } from '@/app/actions/transaction';
import Link from 'next/link';
import CustomDatePicker from '@/components/ui/CustomDatePicker';
import CustomSelect from '@/components/ui/CustomSelect';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function TransactionForm({ 
  portfolioId, 
  categories, 
  isModal = false, 
  onSuccess,
  initialData
}: { 
  portfolioId: string, 
  categories: any[], 
  isModal?: boolean, 
  onSuccess?: () => void,
  initialData?: any
}) {
  const isEdit = !!initialData;
  const actionToUse = isEdit ? updateTransactionAction.bind(null, initialData.id, portfolioId) : createTransactionAction;
  
  const [state, formAction, isPending] = useActionState(actionToUse as any, { error: '' } as any);
  
  const [type, setType] = useState(initialData?.type || 'expense');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  
  const initialDisplayAmount = initialData ? new Intl.NumberFormat('id-ID').format(initialData.amount) : '';
  const [displayAmount, setDisplayAmount] = useState(initialDisplayAmount);

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);

  useEffect(() => {
    if (state?.success && onSuccess) {
      onSuccess();
    }
  }, [state, onSuccess]);

  const initialDate = initialData ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(initialDate);
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '');

  const filteredCategories = categories.filter(c => c.type === type);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      setDisplayAmount('');
      return;
    }
    const formatted = new Intl.NumberFormat('id-ID').format(Number(rawValue));
    setDisplayAmount(formatted);
  };

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
          <Link href={`/dashboard/portfolios/${portfolioId}/transactions`} style={{ fontSize: '1.5rem', textDecoration: 'none', color: 'var(--text-muted)' }}>
            ←
          </Link>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>{isEdit ? 'Edit Transaksi' : 'Catat Transaksi Baru'}</h1>
        </div>
      )}
      {isModal && (
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', marginTop: '-0.5rem' }}>
          {isEdit ? 'Edit Transaksi' : 'Catat Transaksi Baru'}
        </h2>
      )}

      <div style={isModal ? {} : {
        backgroundColor: 'var(--card-bg)',
        padding: '2rem',
        borderRadius: '1rem',
        border: '1px solid var(--border-color)'
      }}>
        <form action={formAction} onSubmit={handleSubmit}>
          {/* Hidden input to pass portfolio ID */}
          <input type="hidden" name="portfolio_id" value={portfolioId} />

          {state?.error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem' }}>{state.error}</div>}
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Jenis Transaksi</label>
            <input type="hidden" name="type" value={type} />
            <div style={{ display: 'flex', backgroundColor: 'var(--bg-color)', borderRadius: '0.5rem', padding: '0.375rem', border: '1px solid var(--border-color)' }}>
              <div 
                onClick={() => { setType('income'); setIsCustomCategory(false); setCategoryId(''); }}
                style={{ 
                  flex: 1, textAlign: 'center', padding: '0.625rem 1rem', cursor: 'pointer', borderRadius: '0.375rem',
                  backgroundColor: type === 'income' ? 'var(--card-bg)' : 'transparent',
                  color: type === 'income' ? 'var(--success)' : 'var(--text-muted)',
                  fontWeight: type === 'income' ? 600 : 400,
                  boxShadow: type === 'income' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s ease-in-out',
                  userSelect: 'none'
                }}
              >
                Pemasukan (+)
              </div>
              <div 
                onClick={() => { setType('expense'); setIsCustomCategory(false); setCategoryId(''); }}
                style={{ 
                  flex: 1, textAlign: 'center', padding: '0.625rem 1rem', cursor: 'pointer', borderRadius: '0.375rem',
                  backgroundColor: type === 'expense' ? 'var(--card-bg)' : 'transparent',
                  color: type === 'expense' ? 'var(--danger)' : 'var(--text-muted)',
                  fontWeight: type === 'expense' ? 600 : 400,
                  boxShadow: type === 'expense' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s ease-in-out',
                  userSelect: 'none'
                }}
              >
                Pengeluaran (-)
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Tanggal Transaksi</label>
            <CustomDatePicker 
              name="date" 
              value={date} 
              onChange={setDate} 
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Kategori</label>
            <CustomSelect 
              name="category_id"
              placeholder="-- Pilih Kategori --"
              value={categoryId}
              onChange={(val: string) => {
                setCategoryId(val);
                setIsCustomCategory(val === 'custom');
              }}
              options={[
                ...filteredCategories.map((c: any) => ({ value: c.id, label: c.name })),
                { value: 'custom', label: '+ Tambah Kategori Baru' }
              ]}
            />
          </div>

          {isCustomCategory && (
            <div style={{ marginBottom: '1.5rem', marginTop: '-0.5rem' }}>
              <input 
                type="text" 
                name="custom_category_name" 
                placeholder="Nama Kategori Baru" 
                required 
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--primary)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-main)',
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="amount" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Jumlah (Rp)</label>
            <input 
              type="text" 
              id="amount" 
              name="amount" 
              placeholder="Contoh: 50.000" 
              value={displayAmount}
              onChange={handleAmountChange}
              required 
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
              defaultValue={initialData?.description || ''}
              placeholder="Contoh: Beli makan siang, Gaji bulanan..." 
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
            {isPending ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Simpan Transaksi')}
          </button>
        </form>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title="Simpan Perubahan?"
        message="Apakah Anda yakin ingin menyimpan perubahan pada transaksi ini?"
        confirmText="Simpan"
        onConfirm={confirmSave}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
