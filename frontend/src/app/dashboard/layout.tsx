'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { logoutAction, getUserMe } from '@/app/actions/auth';
import styles from './layout.module.css';
import { useEffect, useState, useRef } from 'react';
import ProfileModal from '@/components/profile/ProfileModal';
import { LogOut, User as UserIcon } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<{name: string, email: string, avatar?: string, google_id?: string} | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getUserMe().then(data => {
      if (data) setUser(data);
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitial = (name: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const handleUpdateProfile = (data: any) => {
    setUser(prev => prev ? { ...prev, ...data } : null);
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
      </aside>

      <main className={styles.mainContent}>
        <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10 }} ref={dropdownRef}>
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--card-bg)', padding: '0.5rem 1rem', borderRadius: '2rem', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden' }}>
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                getInitial(user?.name || '')
              )}
            </div>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user?.name || 'Pengguna'}</span>
          </div>

          {isDropdownOpen && (
            <div style={{ position: 'absolute', top: '110%', right: '0', backgroundColor: 'var(--card-bg)', borderRadius: '0.75rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', border: '1px solid var(--border-color)', minWidth: '180px', overflow: 'hidden', padding: '0.5rem' }}>
              <button 
                onClick={() => {
                  setIsDropdownOpen(false);
                  setIsProfileModalOpen(true);
                }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: '0.5rem', fontSize: '0.875rem', color: 'var(--text-color)' }}
                className={styles.dropdownItem}
              >
                <UserIcon size={16} /> Profil
              </button>
              
              <form action={logoutAction} style={{ margin: 0 }}>
                <button 
                  type="submit"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#ef4444' }}
                  className={styles.dropdownItem}
                >
                  <LogOut size={16} /> Logout
                </button>
              </form>
            </div>
          )}
        </div>

        <div className={styles.content}>
          {children}
        </div>
      </main>

      {user && (
        <ProfileModal 
          isOpen={isProfileModalOpen} 
          onClose={() => setIsProfileModalOpen(false)} 
          user={user}
          onUpdate={handleUpdateProfile}
        />
      )}
    </div>
  );
}
