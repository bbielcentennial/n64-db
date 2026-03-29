'use client';
import { useTransition } from 'react';
import { toggleGameInListAction } from '@/actions/list';
import styles from './InlineEditors.module.css';

export function InlineListAssigner({ gameId, userLists, activeListIds }: { gameId: number, userLists: any[], activeListIds: string[] }) {
   const [isPending, startTransition] = useTransition();

   const handleToggle = (listId: string, isAdded: boolean) => {
      startTransition(() => {
         void toggleGameInListAction(listId, gameId, isAdded);
      });
   };

   return (
      <div className={styles.inlineBadges}>
         {userLists.map(list => {
            const isAdded = activeListIds.includes(list.id);
            return (
               <label key={list.id} className={`${styles.listBadge} ${isAdded ? styles.activeBadge : ''} ${isPending ? styles.pendingState : ''}`}>
                  <input 
                     type="checkbox" 
                     checked={isAdded}
                     onChange={(e) => handleToggle(list.id, e.target.checked)}
                     disabled={isPending}
                     style={{display: 'none'}}
                  />
                  {list.title}
               </label>
            )
         })}
      </div>
   );
}
