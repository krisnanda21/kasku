import React from 'react';

type StatCardProps = {
  title: string;
  value: string | React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
  trend?: {
    percentage: number;
    // 'positive' (green if > 0, red if < 0)
    // 'negative' (red if > 0, green if < 0) -> e.g. for expenses
    // 'neutral' (always gray)
    type: 'positive' | 'negative' | 'neutral'; 
  };
};

export default function StatCard({ title, value, subtitle, icon, isLoading, trend }: StatCardProps) {
  let trendColor = 'var(--text-muted)';
  let trendIcon = '';
  
  if (trend) {
    const isUp = trend.percentage > 0;
    const isDown = trend.percentage < 0;
    
    if (trend.type === 'neutral') {
      trendColor = 'var(--text-muted)';
    } else if (trend.type === 'positive') {
      if (isUp) trendColor = 'var(--success)';
      if (isDown) trendColor = 'var(--danger)';
    } else if (trend.type === 'negative') {
      // e.g. Expenses: up is bad (red), down is good (green)
      if (isUp) trendColor = 'var(--danger)';
      if (isDown) trendColor = 'var(--success)';
    }
    
    if (isUp) trendIcon = '▲';
    else if (isDown) trendIcon = '▼';
    else trendIcon = '−';
  }

  return (
    <div style={{
      backgroundColor: 'var(--card-bg)',
      padding: '1.5rem',
      borderRadius: '1rem',
      border: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {isLoading ? (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'var(--card-bg)',
          zIndex: 1,
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ height: '20px', width: '50%', backgroundColor: 'var(--border-color)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: '32px', width: '80%', backgroundColor: 'var(--border-color)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: '16px', width: '40%', backgroundColor: 'var(--border-color)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
        </div>
      ) : null}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)', margin: 0 }}>{title}</h3>
        {icon && <div style={{ color: 'var(--text-muted)' }}>{icon}</div>}
      </div>
      
      <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {value}
        {trend && (
          <span style={{ 
            fontSize: '0.875rem', 
            fontWeight: 500, 
            color: trendColor,
            backgroundColor: `color-mix(in srgb, ${trendColor} 15%, transparent)`,
            padding: '0.125rem 0.5rem',
            borderRadius: '1rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            {trendIcon} {Math.abs(trend.percentage).toFixed(1)}%
          </span>
        )}
      </div>
      
      {subtitle && (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
          {subtitle}
        </p>
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
