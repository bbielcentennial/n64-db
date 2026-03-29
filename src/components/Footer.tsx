import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerContent}>
          <p>&copy; {new Date().getFullYear()} N64 Database.</p>
          <p className={styles.muted}>This is a fan-made project for tracking N64 games.</p>
        </div>
      </div>
    </footer>
  );
}
