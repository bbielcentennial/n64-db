'use client';
import { useTransition, useState } from 'react';
import { updateProfileSettingsAction } from '@/actions/profile';
import styles from '@/app/settings/page.module.css';

export default function SettingsForm({ defaultDisplayName, defaultAvatarUrl }: { defaultDisplayName: string, defaultAvatarUrl: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      setMessage("");
      setErrorMsg("");
      
      const res = await updateProfileSettingsAction({
         displayName: formData.get('displayName') as string,
         avatarUrl: formData.get('avatarUrl') as string
      });

      if (res.success) {
         setMessage("Settings saved successfully!");
         setTimeout(() => setMessage(""), 3000);
      } else {
         setErrorMsg(res.error || "An error occurred.");
      }
    });
  }

  const handleClearAvatar = () => {
    startTransition(async () => {
      setMessage(""); setErrorMsg("");
      const res = await updateProfileSettingsAction({ avatarUrl: "BLANK_AVATAR" });
      if (res.success) {
         setMessage("Avatar explicitly cleared!");
         setTimeout(() => setMessage(""), 3000);
      } else {
         setErrorMsg("Failed to clear avatar.");
      }
    });
  }

  return (
    <div className={styles.settingsForm}>
       {message && <div className={styles.successBox}>{message}</div>}
       {errorMsg && <div className={styles.errorBox}>{errorMsg}</div>}

       <form id="settingsFrm" onSubmit={handleSubmit} className={styles.formGroup} style={{gap: '1.5rem'}}>
          <div className={styles.formGroup}>
             <label>Public Display Alias</label>
             <input 
                type="text" 
                name="displayName" 
                defaultValue={defaultDisplayName} 
                placeholder="Leave blank to use default name"
                className={styles.inputField} 
             />
             <span className={styles.hint}>This name will appear on all your public lists and community pages.</span>
          </div>

          <div className={styles.formGroup}>
             <label>Custom Avatar Image URL</label>
             <input 
                type="url" 
                name="avatarUrl" 
                defaultValue={defaultAvatarUrl === 'BLANK_AVATAR' ? '' : defaultAvatarUrl} 
                placeholder="https://example.com/image.png"
                className={styles.inputField} 
             />
             <span className={styles.hint}>Overrides your Google/Discord profile picture.</span>
          </div>
       </form>

       <div className={styles.actionsRow} style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
          <button type="submit" form="settingsFrm" disabled={isPending} className={styles.saveBtn} style={{flex: 1}}>
             {isPending ? 'Working...' : 'Save Settings'}
          </button>
          
          <button type="button" onClick={handleClearAvatar} disabled={isPending} className={styles.saveBtn} style={{backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', flex: 1}}>
             Clear Avatar
          </button>
       </div>
    </div>
  )
}
