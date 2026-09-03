'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { joinPortfolioAction } from '@/app/actions/portfolio';

export default function JoinButton({ token }: { token: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    setIsLoading(true);
    setError('');
    
    const result = await joinPortfolioAction(token);
    
    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else if (result.success && result.portfolio_id) {
      router.push(`/dashboard/portfolios/${result.portfolio_id}/transactions`);
    }
  };

  return (
    <div>
      {error && (
        <div style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}
      <button 
        onClick={handleJoin} 
        disabled={isLoading}
        className="btn btn-primary" 
        style={{ width: '100%', padding: '0.75rem' }}
      >
        {isLoading ? 'Memproses...' : 'Bergabung Sekarang'}
      </button>
    </div>
  );
}
