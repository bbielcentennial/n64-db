import Link from 'next/link';
import Image from 'next/image';
import styles from './Navbar.module.css';
import ThemeToggle from './ThemeToggle';
import { auth, signIn, signOut } from '@/auth';
import { User, LogOut, Settings, LayoutDashboard } from 'lucide-react';
import prisma from '@/lib/prisma';

export default async function Navbar() {
  const session = await auth();
  let avatar = null;
  let display = session?.user?.name;

  if (session?.user?.id) {
     const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
     if (dbUser) {
        display = dbUser.displayName || dbUser.name;
        if (dbUser.avatarUrl && dbUser.avatarUrl !== 'BLANK_AVATAR') avatar = dbUser.avatarUrl;
     }
  }

  return (
    <header className={styles.header}>
      <div className={`container ${styles.navContainer}`}>
        <div className={styles.logoGroup}>
          <Link href="/" className={styles.brand}>MyN64List</Link>
          <nav className={styles.navLinks}>
            <Link href="/games">Games</Link>
            <Link href="/community">Community</Link>
          </nav>
        </div>
        <div className={styles.navRight}>
          <ThemeToggle />
          {session?.user ? (
            <div className={styles.userMenu}>
              <span className={styles.userName}>{display || 'User'}</span>
              <div className={styles.avatarMini}>
                 {avatar ? (
                   <Image src={avatar} alt="User" width={32} height={32} style={{borderRadius: '50%', objectFit: 'cover'}} />
                 ) : (
                   <div style={{background: 'var(--accent)', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'}}>
                     {(display || 'U').charAt(0).toUpperCase()}
                   </div>
                 )}
              </div>
              <Link href={`/user/${session.user.id}`} className={styles.navLink}>My Profile</Link>
              <form
                action={async () => {
                  'use server';
                  await signOut({ redirectTo: '/' });
                }}
              >
                <button type="submit" className={styles.actionBtn}>Logout</button>
              </form>
            </div>
          ) : (
            <form
              action={async () => {
                'use server';
                await signIn(); // Redirects to Auth.js default sign-in options page
              }}
            >
              <button type="submit" className={styles.actionBtn}>Login / Sign Up</button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
