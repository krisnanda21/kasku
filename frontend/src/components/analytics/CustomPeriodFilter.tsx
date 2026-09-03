'use client';

import { useState, useEffect } from 'react';
import CustomSelect from '../ui/CustomSelect';
import CustomDatePicker from '../ui/CustomDatePicker';

type PeriodFilterProps = {
  onChange: (startDate: string, endDate: string) => void;
  defaultPeriod?: string;
};

export default function CustomPeriodFilter({ onChange, defaultPeriod = 'this_month' }: PeriodFilterProps) {
  const [period, setPeriod] = useState(defaultPeriod);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Avoid running on very first render to let parent handle initial load, 
  // actually wait, it's better if parent initializes state identically.
  
  const calculateDates = (selectedPeriod: string) => {
    // using local time
    const today = new Date();
    // format to YYYY-MM-DD
    const formatDate = (date: Date) => {
      const offset = date.getTimezoneOffset()
      date = new Date(date.getTime() - (offset*60*1000))
      return date.toISOString().split('T')[0]
    }

    let start = '';
    let end = formatDate(new Date());

    switch (selectedPeriod) {
      case 'this_month':
        const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        start = formatDate(firstDayThisMonth);
        break;
      case '3_months':
        const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
        start = formatDate(threeMonthsAgo);
        break;
      case '6_months':
        const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
        start = formatDate(sixMonthsAgo);
        break;
      case 'this_year':
        const firstDayThisYear = new Date(today.getFullYear(), 0, 1);
        start = formatDate(firstDayThisYear);
        break;
      case 'custom':
        start = customStart;
        end = customEnd;
        break;
    }

    return { start, end };
  };

  useEffect(() => {
    if (period !== 'custom') {
      const { start, end } = calculateDates(period);
      onChange(start, end);
    }
  }, [period]);

  const handleApplyCustom = () => {
    if (customStart && customEnd) {
      onChange(customStart, customEnd);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'end', flexWrap: 'wrap' }}>
      <div style={{ minWidth: '200px' }}>
        <CustomSelect
          value={period}
          onChange={setPeriod}
          placeholder="Pilih Periode"
          options={[
            { value: 'this_month', label: 'Bulan Ini' },
            { value: '3_months', label: '3 Bulan Terakhir' },
            { value: '6_months', label: '6 Bulan Terakhir' },
            { value: 'this_year', label: 'Tahun Ini' },
            { value: 'custom', label: 'Kustom' },
          ]}
        />
      </div>

      {period === 'custom' && (
        <>
          <div style={{ minWidth: '150px' }}>
            <CustomDatePicker value={customStart} onChange={setCustomStart} />
          </div>
          <span style={{ paddingBottom: '0.5rem' }}>-</span>
          <div style={{ minWidth: '150px' }}>
            <CustomDatePicker value={customEnd} onChange={setCustomEnd} />
          </div>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleApplyCustom}
            disabled={!customStart || !customEnd}
          >
            Terapkan
          </button>
        </>
      )}
    </div>
  );
}
