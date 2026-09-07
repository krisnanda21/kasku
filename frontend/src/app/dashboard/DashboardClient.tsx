'use client';

import { useState, useEffect } from 'react';
import CustomSelect from '@/components/ui/CustomSelect';
import CustomPeriodFilter from '@/components/analytics/CustomPeriodFilter';
import StatCard from '@/components/analytics/StatCard';
import TrendChart from '@/components/analytics/TrendChart';
import CategoryDonutChart from '@/components/analytics/CategoryDonutChart';
import TopTransactions from '@/components/analytics/TopTransactions';
import { Wallet, TrendingUp, TrendingDown, Landmark, Hash, AlertTriangle } from 'lucide-react';

type DashboardClientProps = {
  portfolios: any[];
  token: string;
};

export default function DashboardClient({ portfolios, token }: DashboardClientProps) {
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>(
    portfolios.length > 0 ? portfolios[0].id : ''
  );

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [summary, setSummary] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [topTransactions, setTopTransactions] = useState<any[]>([]);

  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingTrend, setIsLoadingTrend] = useState(false);
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);
  const [isLoadingTopTransactions, setIsLoadingTopTransactions] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

  useEffect(() => {
    if (!selectedPortfolio) return;

    // Only fetch if dates are set (or if we explicitly want to fetch without dates)
    // Actually the period filter will set dates immediately on mount.
    if (!startDate || !endDate) return;

    const queryParams = new URLSearchParams({ start_date: startDate, end_date: endDate }).toString();

    // Fetch Summary
    setIsLoadingSummary(true);
    fetch(`${API_URL}/portfolios/${selectedPortfolio}/analytics/summary?${queryParams}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (!data.error) setSummary(data);
        setIsLoadingSummary(false);
      })
      .catch(() => setIsLoadingSummary(false));

    // Fetch Trend
    setIsLoadingTrend(true);
    fetch(`${API_URL}/portfolios/${selectedPortfolio}/analytics/trend?${queryParams}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.data) setTrendData(data.data);
        setIsLoadingTrend(false);
      })
      .catch(() => setIsLoadingTrend(false));

    // Fetch Category
    setIsLoadingCategory(true);
    fetch(`${API_URL}/portfolios/${selectedPortfolio}/analytics/category?${queryParams}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.data) setCategoryData(data.data);
        setIsLoadingCategory(false);
      })
      .catch(() => setIsLoadingCategory(false));

    // Fetch Top Transactions
    setIsLoadingTopTransactions(true);
    fetch(`${API_URL}/portfolios/${selectedPortfolio}/analytics/top-transactions?${queryParams}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.data) setTopTransactions(data.data);
        setIsLoadingTopTransactions(false);
      })
      .catch(() => setIsLoadingTopTransactions(false));

  }, [selectedPortfolio, startDate, endDate, token, API_URL]);

  if (portfolios.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--card-bg)', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
        <h2>Anda belum memiliki portofolio.</h2>
        <p style={{ color: 'var(--text-muted)' }}>Silakan buat portofolio baru terlebih dahulu.</p>
      </div>
    );
  }

  const incomeCategories = categoryData.filter(d => d.type === 'income');
  const expenseCategories = categoryData.filter(d => d.type === 'expense');

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>

          <div style={{ minWidth: '250px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Pilih Portofolio</label>
            <CustomSelect
              value={selectedPortfolio}
              onChange={setSelectedPortfolio}
              placeholder="Pilih Portofolio..."
              options={portfolios.map(p => ({
                value: p.id,
                label: p.name + (p.role === 'owner' ? ' (Milik Anda)' : ' (Bersama)')
              }))}
            />
          </div>

          <CustomPeriodFilter onChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }} />

        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard
          title="Total Saldo Portofolio"
          value={`Rp ${(summary?.balance || 0).toLocaleString('id-ID')}`}
          icon={<Landmark size={24} />}
          isLoading={isLoadingSummary}
        // Neutral trend for balance
        />
        <StatCard
          title="Total Pemasukan"
          value={`Rp ${(summary?.income || 0).toLocaleString('id-ID')}`}
          icon={<TrendingUp size={24} color="var(--success)" />}
          isLoading={isLoadingSummary}
          trend={summary?.trend?.income !== undefined ? { percentage: summary.trend.income, type: 'positive' } : undefined}
        />
        <StatCard
          title="Total Pengeluaran"
          value={`Rp ${(summary?.expense || 0).toLocaleString('id-ID')}`}
          icon={<TrendingDown size={24} color="var(--danger)" />}
          isLoading={isLoadingSummary}
          trend={summary?.trend?.expense !== undefined ? { percentage: summary.trend.expense, type: 'negative' } : undefined}
        />
        <StatCard
          title={summary?.net >= 0 ? "Surplus" : "Defisit"}
          value={`${summary?.net < 0 ? '-' : ''}Rp ${Math.abs(summary?.net || 0).toLocaleString('id-ID')}`}
          subtitle={summary?.net >= 0 ? "Pemasukan lebih besar" : "Pengeluaran lebih besar"}
          icon={<Wallet size={24} color={summary?.net >= 0 ? "var(--success)" : "var(--danger)"} />}
          isLoading={isLoadingSummary}
          trend={summary?.trend?.net !== undefined ? { percentage: summary.trend.net, type: 'positive' } : undefined}
        />
      </div>

      {/* Insight Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard
          title="Jumlah Transaksi"
          value={summary?.total_transactions || 0}
          subtitle="Total transaksi pada periode ini"
          icon={<Hash size={24} />}
          isLoading={isLoadingSummary}
        />
        <StatCard
          title="Pengeluaran Terbesar"
          value={summary?.top_expense_category || '-'}
          subtitle={summary?.top_expense_category ? `Rp ${(summary?.top_expense_amount || 0).toLocaleString('id-ID')}` : 'Belum ada pengeluaran'}
          icon={<AlertTriangle size={24} color="var(--warning)" />}
          isLoading={isLoadingSummary}
        />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <TrendChart data={trendData} isLoading={isLoadingTrend} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <CategoryDonutChart
          title="Kategori Pengeluaran"
          data={expenseCategories}
          type="expense"
          isLoading={isLoadingCategory}
        />
        <CategoryDonutChart
          title="Kategori Pemasukan"
          data={incomeCategories}
          type="income"
          isLoading={isLoadingCategory}
        />
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <TopTransactions data={topTransactions} isLoading={isLoadingTopTransactions} />
      </div>
    </div>
  );
}
