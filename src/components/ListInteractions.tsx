'use client';

import { useTransition } from 'react';
import { toggleListLikeAction, toggleListFollowAction, setListCoverAction, removeGameFromListAction } from '@/actions/list';
import { Heart, Check, Plus, Image as ImageIcon, X, ImagePlus } from 'lucide-react';
import styles from '@/app/list/[id]/page.module.css';

export function ListLikeFollowUI({ listId, isLiked, isFollowed, isOwner }: { listId: string, isLiked: boolean, isFollowed: boolean, isOwner: boolean }) {
  const [isPending, startTransition] = useTransition();

  if (isOwner) return null;

  return (
     <div className={styles.socialActions}>
       <button onClick={() => startTransition(() => { void toggleListLikeAction(listId); })} disabled={isPending} className={`${styles.socialBtn} ${isLiked ? styles.liked : ''}`}>
          {isLiked ? <Heart size={16} fill="currentColor" /> : <Heart size={16} />}
          <span>{isLiked ? 'Liked' : 'Like'}</span>
       </button>
       <button onClick={() => startTransition(() => { void toggleListFollowAction(listId); })} disabled={isPending} className={`${styles.socialBtn} ${isFollowed ? styles.followed : ''}`}>
          {isFollowed ? <Check size={16} /> : <Plus size={16} />} 
          <span>{isFollowed ? 'Following' : 'Follow'}</span>
       </button>
     </div>
  )
}

export function OwnerRowActions({ listId, gameId, isCurrentCover }: { listId: string, gameId: number, isCurrentCover: boolean }) {
   const [isPending, startTransition] = useTransition();

   return (
      <div className={styles.rowActions}>
         {!isCurrentCover ? (
           <button onClick={() => startTransition(() => { void setListCoverAction(listId, gameId); })} disabled={isPending} className={styles.iconBtn} title="Set as List Cover">
              <ImagePlus size={18} />
           </button>
         ) : (
           <span className={styles.currentCoverIcon} title="Current Cover"><ImageIcon size={18} /></span>
         )}
         <button onClick={() => startTransition(() => { void removeGameFromListAction(listId, gameId); })} disabled={isPending} className={styles.iconBtnRemove} title="Remove from List">
            <X size={18} />
         </button>
      </div>
   )
}
