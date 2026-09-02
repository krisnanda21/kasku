import styles from "./page.module.css";
import Link from "next/link";

export default function Home() {
  return (
    <main className={styles.hero}>
      <div className="animate-fade-in">
        <h1 className={styles.title}>KasKu</h1>
        <p className={styles.subtitle}>
          Aplikasi manajemen kas komunitas yang transparan, mudah, dan kolaboratif.
          Lacak setiap pemasukan dan pengeluaran secara real-time.
        </p>
        
        <div className={styles.ctaGroup}>
          <Link href="/register" className="btn btn-primary">
            Mulai Sekarang
          </Link>
          <Link href="/login" className="btn btn-secondary">
            Masuk
          </Link>
        </div>

        <div className={styles.features}>
          <div className={`card ${styles.featureCard}`}>
            <div className={styles.featureIcon}>💼</div>
            <h3 className={styles.featureTitle}>Multi Portofolio</h3>
            <p className={styles.featureDesc}>Kelola banyak kas komunitas atau pribadi dalam satu akun tanpa ribet.</p>
          </div>
          <div className={`card ${styles.featureCard}`}>
            <div className={styles.featureIcon}>🤝</div>
            <h3 className={styles.featureTitle}>Kolaborasi Tim</h3>
            <p className={styles.featureDesc}>Undang anggota dengan akses View atau Edit untuk transparansi penuh.</p>
          </div>
          <div className={`card ${styles.featureCard}`}>
            <div className={styles.featureIcon}>📊</div>
            <h3 className={styles.featureTitle}>Laporan Lengkap</h3>
            <p className={styles.featureDesc}>Ekspor laporan mutasi ke PDF atau Excel dengan satu klik.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
