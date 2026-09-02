'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/actions/auth';
import styles from './layout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className={styles.dashboardContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.logo}>KasKu.</Link>
        </div>
        <nav className={styles.nav}>
          <Link href="/dashboard" className={styles.navLink}>
            Dashboard
          </Link>
          <Link href="/dashboard/portfolios" className={styles.navLink}>
            Portofolio
          </Link>
          <Link href="/dashboard/reports" className={styles.navLink}>
            Laporan
          </Link>
        </nav>
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
        <header className={styles.header}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Dashboard</h2>
          <div>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              U
            </div>
          </div>
        </header>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
