'use client';
import { useTransition, useState } from 'react';
import { updateUserGameAction, createListAction, toggleGameInListAction } from '@/actions/list';
import styles from './TrackGameForm.module.css';
import { Layers } from 'lucide-react';

type UserList = { id: string, title: string };

export default function TrackGameForm({ 
   gameId, 
   gameName,
   userLists,
   userGame,
   activeListIds
}: { 
   gameId: number, 
   gameName: string,
   userLists: UserList[],
   userGame: { score: number | null, status: string } | null,
   activeListIds: string[]
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Status/Score State
  const [status, setStatus] = useState<string>(userGame?.status || "PLAN_TO_PLAY");
  const [score, setScore] = useState<number>(userGame?.score || 0);
  const [hoverScore, setHoverScore] = useState<number | null>(null);

  // New List State
  const [newTitle, setNewTitle] = useState("");

  const handleUpdateUniversal = (newStatus?: string, newScore?: number) => {
      startTransition(() => {
          void updateUserGameAction(gameId, { 
             status: newStatus !== undefined ? (newStatus as any) : undefined, 
             score: newScore !== undefined ? newScore : undefined 
          });
      });
  };

  const handleToggleList = (listId: string, current: boolean) => {
      startTransition(() => {
          void toggleGameInListAction(listId, gameId, !current); 
      });
  };

  const handleCreateList = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTitle.trim()) return;
      
      const res = await createListAction({ title: newTitle, isPublic: true, description: '' });
      if (res.success && res.listId) {
          startTransition(() => {
             void toggleGameInListAction(res.listId!, gameId, true); 
          });
          setNewTitle("");
      }
  };

  const displayScore = hoverScore !== null ? hoverScore : score;

  return (
    <div className={styles.wrapper}>
       <button className={styles.triggerBtn} onClick={() => setIsOpen(true)}>
          <span style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
             <Layers size={18} /> Manage Game
          </span>
       </button>

       {isOpen && (
          <div className={styles.modalOverlay} onClick={() => setIsOpen(false)}>
              <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                 <div className={styles.modalHeader}>
                     <h3>Manage {gameName}</h3>
                     <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>&times;</button>
                 </div>
                 
                 <div className={styles.modalBody}>
                    <div className={styles.universalSection}>
                       <h4>Universal Rating & Status</h4>
                       <div className={styles.controlRow}>
                           <select 
                               className={styles.statusSelect}
                               value={status} 
                               onChange={e => { 
                                  setStatus(e.target.value); 
                                  handleUpdateUniversal(e.target.value, undefined); 
                               }} 
                               disabled={isPending}
                           >
                              <option value="PLAN_TO_PLAY">Want to Play</option>
                              <option value="PLAYING">Currently Playing</option>
                              <option value="COMPLETED">Completed</option>
                              <option value="ON_HOLD">On Hold</option>
                              <option value="DROPPED">Dropped</option>
                           </select>
                           
                           <div className={styles.starRating} onMouseLeave={() => setHoverScore(null)}>
                             {[1, 2, 3, 4, 5].map(starIndex => {
                                const leftVal = starIndex * 2 - 1; 
                                const rightVal = starIndex * 2;    
                                
                                const isFull = displayScore >= rightVal;
                                const isHalf = displayScore === leftVal;

                                return (
                                  <div key={starIndex} className={styles.starWrapper}>
                                     <div 
                                        className={styles.starHalfLeft}
                                        onMouseEnter={() => setHoverScore(leftVal)}
                                        onClick={() => { setScore(leftVal); handleUpdateUniversal(undefined, leftVal); }}
                                     />
                                     <div 
                                        className={styles.starHalfRight}
                                        onMouseEnter={() => setHoverScore(rightVal)}
                                        onClick={() => { setScore(rightVal); handleUpdateUniversal(undefined, rightVal); }}
                                     />
                                     <span className={`${styles.starIcon} ${isFull ? styles.fullStar : isHalf ? styles.halfStar : styles.emptyStar}`}>★</span>
                                  </div>
                                )
                             })}
                             <span className={styles.scoreTextLabel}>{displayScore > 0 ? (displayScore / 2).toFixed(1) : '-'}</span>
                           </div>
                       </div>
                    </div>

                    <div className={styles.listsSection}>
                       <h4>Add to Custom Lists</h4>
                       <div className={styles.listsContainer}>
                           {userLists.length === 0 ? (
                               <div style={{color: 'var(--text-muted)'}}>You haven't created any lists yet.</div>
                           ) : (
                               userLists.map(list => {
                                  const isActive = activeListIds.includes(list.id);
                                  return (
                                     <label key={list.id} className={styles.listLabel}>
                                         <input type="checkbox" checked={isActive} onChange={() => handleToggleList(list.id, isActive)} disabled={isPending} />
                                         <span>{list.title}</span>
                                     </label>
                                  )
                               })
                           )}
                       </div>

                       <form onSubmit={handleCreateList} className={styles.createListInline}>
                           <input type="text" placeholder="+ Create new list..." value={newTitle} onChange={e => setNewTitle(e.target.value)} disabled={isPending} required />
                           <button type="submit" disabled={isPending || !newTitle.trim()}>Create</button>
                       </form>
                    </div>
                 </div>
              </div>
          </div>
       )}
    </div>
  )
}
