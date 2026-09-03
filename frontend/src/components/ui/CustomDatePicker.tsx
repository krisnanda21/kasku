'use client';
import { useState, useRef, useEffect } from 'react';

export default function CustomDatePicker({ name, value, onChange }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const selectedDate = value ? new Date(value) : new Date();
  
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = currentMonth.getDay();
  
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  }
  
  const formatDate = (date: Date) => {
    // Format to YYYY-MM-DD avoiding timezone shift
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset*60*1000));
    return localDate.toISOString().split('T')[0];
  };
  
  const displayFormat = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const todayStr = formatDate(new Date());

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {name && <input type="hidden" name={name} value={value || ''} />}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '0.75rem 1rem',
          borderRadius: '0.5rem',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-color)',
          color: value ? 'var(--text-main)' : 'var(--text-muted)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span>{value ? displayFormat(value) : 'Pilih Tanggal'}</span>
        <span style={{ opacity: 0.5 }}>📅</span>
      </div>
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '0.5rem',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '1rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          zIndex: 50,
          padding: '1rem',
          width: '320px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <button type="button" onClick={handlePrevMonth} style={{ background: 'var(--bg-color)', border: 'none', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>&lt;</button>
            <div style={{ fontWeight: 600 }}>
              {currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </div>
            <button type="button" onClick={handleNextMonth} style={{ background: 'var(--bg-color)', border: 'none', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>&gt;</button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', textAlign: 'center', marginBottom: '0.5rem' }}>
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
              <div key={d} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{d}</div>
            ))}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem' }}>
            {days.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />;
              
              const dayStr = formatDate(day);
              const isSelected = value === dayStr;
              const isToday = todayStr === dayStr;
              
              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    onChange(dayStr);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '0.5rem 0',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--primary)' : isToday ? 'var(--bg-color)' : 'transparent',
                    color: isSelected ? '#fff' : isToday ? 'var(--primary)' : 'var(--text-main)',
                    fontWeight: isSelected || isToday ? 600 : 400,
                    outline: isToday && !isSelected ? '1px solid var(--primary)' : 'none',
                    transition: 'all 0.1s ease-in-out'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-color)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = isToday ? 'var(--bg-color)' : 'transparent';
                  }}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
             <button 
                type="button" 
                onClick={() => { onChange(todayStr); setIsOpen(false); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
             >
                Hari Ini
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
