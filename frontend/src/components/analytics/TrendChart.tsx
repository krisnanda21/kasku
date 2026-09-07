'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type TrendChartProps = {
  data: any[];
  isLoading?: boolean;
};

export default function TrendChart({ data, isLoading }: TrendChartProps) {
  // Process data from backend to Recharts format
  // Backend returns: [{ date: "YYYY-MM-DD", type: "income", total: 100 }, ...]
  
  // We need to group by date: { date: "YYYY-MM-DD", income: 100, expense: 50 }
  const chartData = data.reduce((acc, curr) => {
    let existing = acc.find((item: any) => item.date === curr.date);
    if (!existing) {
      existing = { date: curr.date, income: 0, expense: 0 };
      acc.push(existing);
    }
    existing[curr.type] = curr.total;
    return acc;
  }, []);

  return (
    <div style={{
      backgroundColor: 'var(--card-bg)',
      padding: '1.5rem',
      borderRadius: '1rem',
      border: '1px solid var(--border-color)',
      position: 'relative',
      overflow: 'hidden',
      height: '400px'
    }}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Tren Keuangan</h3>
      
      {isLoading ? (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'var(--card-bg)',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '1rem'
        }}>
           <div style={{ height: '200px', width: '80%', backgroundColor: 'var(--border-color)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
        </div>
      ) : chartData.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-muted)' }}>
          Belum ada transaksi di periode ini.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--success)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--danger)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
            <XAxis 
              dataKey="date" 
              stroke="var(--text-muted)" 
              fontSize={12} 
              tickMargin={10} 
              tickFormatter={(val) => {
                const date = new Date(val);
                return `${date.getDate()} ${date.toLocaleString('id-ID', { month: 'short' })}`;
              }}
            />
            <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(value) => `Rp ${value / 1000}k`} />
            <Tooltip 
              formatter={((value: number) => `Rp ${value.toLocaleString('id-ID')}`) as any}
              labelFormatter={((label: string) => new Date(label).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })) as any}
              contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderRadius: '0.5rem' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Area type="monotone" dataKey="income" name="Pemasukan" stroke="var(--success)" fillOpacity={1} fill="url(#colorIncome)" />
            <Area type="monotone" dataKey="expense" name="Pengeluaran" stroke="var(--danger)" fillOpacity={1} fill="url(#colorExpense)" />
          </AreaChart>
        </ResponsiveContainer>
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
