'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { logoutAction, getUserMe } from '@/app/actions/auth';
import styles from './layout.module.css';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<{name: string, email: string} | null>(null);

  useEffect(() => {
    getUserMe().then(data => {
      if (data) setUser(data);
    });
  }, []);

  const getInitial = (name: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className={styles.dashboardContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader} style={{ display: 'flex', justifyContent: 'center' }}>
          <Link href="/" className={styles.logo} style={{ display: 'flex', alignItems: 'center' }}>
            <Image src="/2_logo_sidebar.svg" alt="KasKu Logo" width={200} height={80} priority />
          </Link>
        </div>

        <nav className={styles.nav}>
          <Link
            href="/dashboard"
            className={`${styles.navItem} ${pathname === '/dashboard' ? styles.navItemActive : ''}`}
          >
            📊 Overview
          </Link>
          <Link
            href="/dashboard/portfolios"
            className={`${styles.navItem} ${pathname.startsWith('/dashboard/portfolios') ? styles.navItemActive : ''}`}
          >
            💼 Portofolio
          </Link>
          <Link
            href="/dashboard/reports"
            className={`${styles.navItem} ${pathname.startsWith('/dashboard/reports') ? styles.navItemActive : ''}`}
          >
            📑 Laporan
          </Link>
        </nav>
        <form action={logoutAction}>
          <button type="submit" className={styles.logoutBtn}>
            Keluar
          </button>
        </form>
      </aside>

      <main className={styles.mainContent}>
        <div style={{ position: 'absolute', top: '1.5rem', right: '2rem', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--card-bg)', padding: '0.5rem 1rem', borderRadius: '2rem', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {getInitial(user?.name || '')}
            </div>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user?.name || 'Pengguna'}</span>
          </div>
        </div>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
