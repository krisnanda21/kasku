'use client';
import { useState, useRef, useEffect } from 'react';

export default function CustomSelect({ options, value, onChange, placeholder = 'Pilih Opsi', name }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt: any) => opt.value === value);

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
          color: selectedOption ? 'var(--text-main)' : 'var(--text-muted)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <span style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', fontSize: '0.75rem', opacity: 0.5 }}>▼</span>
      </div>
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '0.5rem',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          zIndex: 50,
          maxHeight: '250px',
          overflowY: 'auto'
        }}>
          {options.map((opt: any) => (
            <div 
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              style={{
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                backgroundColor: value === opt.value ? 'var(--bg-color)' : 'transparent',
                color: value === opt.value ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: value === opt.value ? 600 : 400,
                transition: 'all 0.1s ease-in-out',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => {
                if (value !== opt.value) e.currentTarget.style.backgroundColor = 'var(--bg-color)';
              }}
              onMouseLeave={(e) => {
                if (value !== opt.value) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span>{opt.label}</span>
              {value === opt.value && <span>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
