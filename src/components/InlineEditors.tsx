'use client';
import { useTransition, useState } from 'react';
import { updateUserGameAction } from '@/actions/list';
import styles from './InlineEditors.module.css';

interface EditorProps {
   gameId: number;
}

export function InlineStarRating({ gameId, currentScore }: EditorProps & { currentScore: number | null }) {
   const [isPending, startTransition] = useTransition();

   const handleScore = (score: number) => {
      startTransition(() => {
         updateUserGameAction(gameId, { score });
      });
   };

   // Renders 1-10 mapping (5 stars, half-steps)
   return (
      <div className={`${styles.inlineStarRow} ${isPending ? styles.pendingState : ''}`}>
         {[1, 2, 3, 4, 5].map(starIndex => {
            const starValue = starIndex * 2; // e.g. Star 1 is 2, Star 2 is 4
            const displayScore = currentScore || 0;
            
            let fillPercentage = 0;
            if (displayScore >= starValue) fillPercentage = 100;
            else if (displayScore === starValue - 1) fillPercentage = 50;
            
            return (
               <div key={starIndex} className={styles.starWrapper}>
                  <div className={styles.starVisual} style={{
                     background: `linear-gradient(90deg, #ffc107 ${fillPercentage}%, #444 ${fillPercentage}%)`,
                     WebkitBackgroundClip: 'text',
                     WebkitTextFillColor: 'transparent',
                  }}>★</div>
                  <div 
                     className={styles.halfLeft} 
                     onClick={() => handleScore(starValue - 1)} 
                     title={`${(starValue - 1)/2} Stars`}
                  />
                  <div 
                     className={styles.halfRight} 
                     onClick={() => handleScore(starValue)} 
                     title={`${starValue/2} Stars`}
                  />
               </div>
            );
         })}
      </div>
   );
}

export function InlineStatusSelect({ gameId, currentStatus, customStatus }: EditorProps & { currentStatus: string, customStatus?: string | null }) {
   const [isPending, startTransition] = useTransition();

   const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const status = e.target.value;
      if (status === 'CUSTOM') {
         const str = window.prompt("Enter a Custom Status string (e.g. Speedrunning, Found Cartridge, etc):", customStatus || "");
         if (str !== null) {
            startTransition(() => {
               updateUserGameAction(gameId, { status: "CUSTOM", customStatus: str });
            });
         }
      } else {
         startTransition(() => {
            updateUserGameAction(gameId, { status, customStatus: null });
         });
      }
   };

   // Display custom text if relevant
   const displayValue = currentStatus === 'CUSTOM' && customStatus ? `CUSTOM (${customStatus})` : currentStatus;

   return (
      <select 
         value={currentStatus} 
         onChange={handleChange} 
         disabled={isPending}
         title={displayValue}
         className={`${styles.inlineSelect} ${styles[currentStatus] || ''} ${isPending ? styles.pendingState : ''}`}
      >
         <option value="PLAYING">PLAYING</option>
         <option value="COMPLETED">COMPLETED</option>
         <option value="PLAN_TO_PLAY">PLAN TO PLAY</option>
         <option value="DROPPED">DROPPED</option>
         <option value="CUSTOM">{currentStatus === 'CUSTOM' ? displayValue : 'CUSTOM...'}</option>
      </select>
   );
}
