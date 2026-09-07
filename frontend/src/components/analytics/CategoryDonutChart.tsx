'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

type CategoryDonutChartProps = {
  title: string;
  data: any[];
  isLoading?: boolean;
  type: 'income' | 'expense';
};

export default function CategoryDonutChart({ title, data, isLoading, type }: CategoryDonutChartProps) {
  
  // Custom colors for Donut chart based on type to give different feel
  const incomeColors = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#059669'];
  const expenseColors = ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#dc2626'];
  const colors = type === 'income' ? incomeColors : expenseColors;

  return (
    <div style={{
      backgroundColor: 'var(--card-bg)',
      padding: '1.5rem',
      borderRadius: '1rem',
      border: '1px solid var(--border-color)',
      position: 'relative',
      overflow: 'hidden',
      height: '350px'
    }}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>{title}</h3>
      
      {isLoading ? (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'var(--card-bg)',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
           <div style={{ height: '150px', width: '150px', backgroundColor: 'var(--border-color)', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
        </div>
      ) : data.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '250px', color: 'var(--text-muted)' }}>
          Belum ada {type === 'income' ? 'pemasukan' : 'pengeluaran'} di periode ini.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="total"
              nameKey="category"
              label={((props: any) => {
                const { cx, cy, midAngle, innerRadius, outerRadius, value, index } = props;
                const totalAmount = data.reduce((sum: any, item: any) => sum + item.total, 0);
                const percent = (value / totalAmount) * 100;
                
                // Only show label if percentage is > 5% to avoid cluttering
                if (percent < 5) return null;
                
                const RADIAN = Math.PI / 180;
                // Calculate position for call-out (further outside the radius)
                const radius = outerRadius * 1.2;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                
                // Align text based on which side of the donut it is
                const textAnchor = x > cx ? 'start' : 'end';
                
                return (
                  <text 
                    x={x} 
                    y={y} 
                    fill="var(--text-muted)" 
                    textAnchor={textAnchor} 
                    dominantBaseline="central"
                    fontSize={11}
                    fontWeight={500}
                  >
                    {`${data[index].category} (${percent.toFixed(0)}%)`}
                  </text>
                );
              }) as any}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={((value: number, name: string) => {
                const totalAmount = data.reduce((sum: any, item: any) => sum + item.total, 0);
                const percentage = totalAmount > 0 ? ((value / totalAmount) * 100).toFixed(1) : 0;
                return [`Rp ${value.toLocaleString('id-ID')} (${percentage}%)`, name];
              }) as any}
              contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderRadius: '0.5rem' }}
            />
          </PieChart>
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
