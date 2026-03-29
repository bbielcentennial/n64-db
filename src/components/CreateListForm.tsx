'use client';
import { useTransition, useState } from 'react';
import { createListAction } from '@/actions/list';
import styles from '@/app/user/[id]/page.module.css';

export default function CreateListForm() {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  
  if (!isOpen) {
    return (
       <button className={styles.createBtn} onClick={() => setIsOpen(true)}>+ Create New List</button>
    );
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const res = await createListAction({
         title: formData.get('title') as string,
         description: formData.get('description') as string,
         isPublic: formData.get('isPublic') === 'true'
      });

      if (res?.success) {
         setIsOpen(false);
      } else {
         alert(res?.error || "Failed to create list");
      }
    });
  };

  return (
    <div className={styles.createListFlyout}>
      <h3>Create a New List</h3>
      <form onSubmit={handleSubmit} className={styles.createForm}>
         <input type="text" name="title" required placeholder="e.g. Hidden Gems" className={styles.inputField} />
         <textarea name="description" placeholder="A brief description..." className={styles.inputField} rows={3} />
         <div className={styles.toggleRow}>
            <label>
               <input type="radio" name="isPublic" value="true" defaultChecked /> Public (Visible to Community)
            </label>
            <label>
               <input type="radio" name="isPublic" value="false" /> Private
            </label>
         </div>
         <div className={styles.actionsRow}>
            <button type="submit" disabled={isPending} className={styles.saveBtn}>{isPending ? 'Saving...' : 'Create'}</button>
            <button type="button" onClick={() => setIsOpen(false)} className={styles.cancelBtn}>Cancel</button>
         </div>
      </form>
    </div>
  );
}
