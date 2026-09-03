import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { joinPortfolioAction } from '@/app/actions/portfolio';
import JoinButton from './JoinButton';

async function getInvitePreview(token: string) {
  const cookieStore = await cookies();
  const jwtToken = cookieStore.get('jwt')?.value;

  const headers: any = {};
  if (jwtToken) {
    headers['Authorization'] = `Bearer ${jwtToken}`;
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/invitations/preview?token=${token}`, {
    headers,
    cache: 'no-store'
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  return data.data;
}

export default async function InvitePage(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;
  const token = searchParams.token;

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)' }}>
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '3rem', borderRadius: '1rem', textAlign: 'center', maxWidth: '400px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Token Tidak Valid</h1>
          <p style={{ color: 'var(--text-muted)' }}>Link undangan yang Anda gunakan tidak valid atau tidak lengkap.</p>
          <Link href="/login" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '2rem' }}>
            Kembali
          </Link>
        </div>
      </div>
    );
  }

  const preview = await getInvitePreview(token);

  if (!preview) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)' }}>
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '3rem', borderRadius: '1rem', textAlign: 'center', maxWidth: '400px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Undangan Kadaluarsa</h1>
          <p style={{ color: 'var(--text-muted)' }}>Link undangan ini tidak valid atau telah dinonaktifkan oleh pemilik portofolio.</p>
          <Link href="/login" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '2rem' }}>
            Kembali
          </Link>
        </div>
      </div>
    );
  }

  const cookieStore = await cookies();
  const jwtToken = cookieStore.get('jwt')?.value;
  const isLoggedIn = !!jwtToken;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)' }}>
      <div style={{ backgroundColor: 'var(--card-bg)', padding: '3rem', borderRadius: '1rem', textAlign: 'center', maxWidth: '500px', width: '90%', border: '1px solid var(--border-color)' }}>
        <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2rem' }}>
          💼
        </div>
        
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Undangan Portofolio
        </h1>
        
        <p style={{ color: 'var(--text-main)', fontSize: '1.125rem', marginBottom: '2rem', lineHeight: '1.6' }}>
          Anda diundang oleh <strong>{preview.owner_name}</strong> untuk bergabung ke portofolio <strong style={{ color: 'var(--primary)' }}>{preview.portfolio_name}</strong>.
        </p>

        <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Hak Akses yang diberikan:</p>
          <p style={{ fontWeight: 600, fontSize: '1.125rem' }}>
            {preview.role === 'edit' ? 'Editor (Bisa ubah transaksi)' : 'Viewer (Hanya lihat)'}
          </p>
        </div>

        {!isLoggedIn ? (
          <div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Silakan masuk (login) terlebih dahulu untuk bergabung.</p>
            <Link href={`/login?callbackUrl=${encodeURIComponent(`/invite?token=${token}`)}`} className="btn btn-primary" style={{ width: '100%', display: 'block', padding: '0.75rem' }}>
              Masuk / Daftar
            </Link>
          </div>
        ) : (
          <JoinButton token={token} />
        )}
      </div>
    </div>
  );
}
