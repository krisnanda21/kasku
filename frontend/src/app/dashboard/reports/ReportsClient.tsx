'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Download, X } from 'lucide-react';
import CustomDatePicker from '@/components/ui/CustomDatePicker';
import CustomSelect from '@/components/ui/CustomSelect';

type Portfolio = {
  id: string;
  name: string;
  balance: number;
};

type ReportsClientProps = {
  portfolios: Portfolio[];
  token: string;
};

export default function ReportsClient({ portfolios, token }: ReportsClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [txType, setTxType] = useState('all');
  const [categoryId, setCategoryId] = useState('all');
  
  const [categories, setCategories] = useState<{value: string, label: string}[]>([]);
  
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Gunakan ref untuk mencegah race condition dari klik beruntun secara sinkron
  const isDownloadingRef = useRef(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

  // Format today's date for defaults
  useEffect(() => {
    if (isModalOpen) {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const formatDate = (date: Date) => {
        const offset = date.getTimezoneOffset();
        const d = new Date(date.getTime() - (offset*60*1000));
        return d.toISOString().split('T')[0];
      };

      setStartDate(formatDate(firstDayOfMonth));
      setEndDate(formatDate(today));
      setTxType('all');
      setCategoryId('all');
      setErrorMsg('');
      
      // Fetch categories for the selected portfolio
      if (selectedPortfolio) {
        fetch(`${API_URL}/categories?portfolio_id=${selectedPortfolio.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
          if (data.data) {
            const catOptions = data.data.map((c: any) => ({
              value: c.id,
              label: c.name
            }));
            setCategories([{value: 'all', label: 'Semua Kategori'}, ...catOptions]);
          }
        })
        .catch(console.error);
      }
    }
  }, [isModalOpen, selectedPortfolio, API_URL, token]);

  const openDownloadModal = (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio);
    setIsModalOpen(true);
  };

  const handleDownload = async (format: 'pdf' | 'excel') => {
    if (!selectedPortfolio) return;
    if (isDownloadingRef.current || isDownloadingPDF || isDownloadingExcel) return;
    
    isDownloadingRef.current = true;
    setErrorMsg('');
    if (format === 'pdf') setIsDownloadingPDF(true);
    if (format === 'excel') setIsDownloadingExcel(true);

    try {
      const queryParams = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        type: txType,
        category_id: categoryId,
        token: token
      }).toString();

      const url = `${API_URL}/portfolios/${selectedPortfolio.id}/export/${format}?${queryParams}`;
      
      // Menggunakan native anchor click (tidak menggunakan fetch) 
      // untuk menghindari interupsi browser/ekstensi (IDM) terhadap object stream
      const a = document.createElement('a');
      a.href = url;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Tutup modal jika berhasil agar UX lebih baik
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Download error:", err);
      // Hanya set pesan error jika modal masih terbuka (bukan error palsu pasca-download)
      setErrorMsg(err.message || 'Terjadi kesalahan saat mengunduh laporan');
    } finally {
      isDownloadingRef.current = false;
      setIsDownloadingPDF(false);
      setIsDownloadingExcel(false);
    }
  };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {portfolios.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', backgroundColor: 'var(--card-bg)', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
            Anda belum memiliki portofolio.
          </div>
        ) : (
          portfolios.map((p) => (
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

              <div style={{ marginTop: 'auto' }}>
                <button type="button"
                  onClick={() => openDownloadModal(p)}
                  className="btn btn-primary" 
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Download size={18} /> Unduh Laporan
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && selectedPortfolio && (
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
            maxWidth: '500px',
            padding: '2rem',
            position: 'relative',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <button type="button"
              onClick={() => setIsModalOpen(false)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)'
              }}
              disabled={isDownloadingPDF || isDownloadingExcel}
            >
              <X size={24} />
            </button>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Ekspor Laporan</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Portofolio: <strong style={{color: 'var(--text-color)'}}>{selectedPortfolio.name}</strong>
            </p>

            {errorMsg && (
              <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', border: '1px solid #f87171' }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Mulai Tanggal</label>
                  <CustomDatePicker value={startDate} onChange={setStartDate} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Sampai Tanggal</label>
                  <CustomDatePicker value={endDate} onChange={setEndDate} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Tipe Transaksi</label>
                <CustomSelect
                  value={txType}
                  onChange={setTxType}
                  options={[
                    { value: 'all', label: 'Semua Tipe' },
                    { value: 'income', label: 'Pemasukan Saja' },
                    { value: 'expense', label: 'Pengeluaran Saja' }
                  ]}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Kategori</label>
                <CustomSelect
                  value={categoryId}
                  onChange={setCategoryId}
                  options={categories.length > 0 ? categories : [{value: 'all', label: 'Semua Kategori'}]}
                  placeholder="Memuat kategori..."
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button"
                onClick={() => handleDownload('pdf')}
                disabled={isDownloadingPDF || isDownloadingExcel || !startDate || !endDate}
                className="btn btn-primary"
                style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
              >
                {isDownloadingPDF ? <Loader2 size={18} className="spin" /> : '📄 Unduh PDF'}
              </button>
              <button type="button"
                onClick={() => handleDownload('excel')}
                disabled={isDownloadingPDF || isDownloadingExcel || !startDate || !endDate}
                className="btn btn-secondary"
                style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', backgroundColor: (isDownloadingPDF || isDownloadingExcel || !startDate || !endDate) ? '#d1d5db' : '#10b981', color: (isDownloadingPDF || isDownloadingExcel || !startDate || !endDate) ? '#9ca3af' : 'white', borderColor: (isDownloadingPDF || isDownloadingExcel || !startDate || !endDate) ? '#d1d5db' : '#10b981' }}
              >
                {isDownloadingExcel ? <Loader2 size={18} className="spin" /> : '📊 Unduh Excel'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </>
  );
}
