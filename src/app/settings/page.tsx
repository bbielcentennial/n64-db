import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import styles from './page.module.css';
import SettingsForm from '@/components/SettingsForm';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return redirect('/api/auth/signin');

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  
  return (
    <div className={`container ${styles.settingsContainer}`}>
      <div className={styles.settingsHeader}>
         <h1>Privacy & Settings</h1>
         <p>Manage how your profile appears to the community and override OAuth defaults.</p>
      </div>
      
      <div className={styles.settingsCard}>
         <SettingsForm 
            defaultDisplayName={user?.displayName || ''} 
            defaultAvatarUrl={user?.avatarUrl || ''} 
         />
      </div>
    </div>
  )
}
