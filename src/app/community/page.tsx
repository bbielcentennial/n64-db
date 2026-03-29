import prisma from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Flame, Sparkles, Trophy, Gamepad2 } from 'lucide-react';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function CommunityPage() {
   const topLists = await prisma.list.findMany({
      where: { isPublic: true },
      include: {
         user: { select: { name: true, displayName: true } },
         coverGame: { select: { coverUrl: true } },
         _count: { select: { likes: true, items: true } }
      },
      orderBy: { likes: { _count: 'desc' } },
      take: 12
   });

   const recentLists = await prisma.list.findMany({
      where: { isPublic: true },
      include: {
         user: { select: { name: true, displayName: true } },
         coverGame: { select: { coverUrl: true } },
         _count: { select: { likes: true, items: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 12
   });

   const mostCompletedGames = await prisma.game.findMany({
      where: { completedCount: { gt: 0 } },
      orderBy: { completedCount: 'desc' },
      take: 6
   });

   const mostPlayedGames = await prisma.game.findMany({
      where: { playedCount: { gt: 0 } },
      orderBy: { playedCount: 'desc' },
      take: 6
   });

   const renderListCard = (list: any) => (
     <Link href={`/list/${list.id}`} key={list.id} className={styles.listCard}>
        <div className={styles.listCoverWrapper}>
           {list.coverGame?.coverUrl ? (
             <Image src={list.coverGame.coverUrl} alt="Cover" fill sizes="(max-width: 768px) 150px, 200px" style={{objectFit: 'cover'}} />
           ) : (
             <div className={styles.placeholderListCover}></div>
           )}
        </div>
        <div className={styles.listCardContent}>
           <h3>{list.title}</h3>
           <span className={styles.listAuthor}>by {list.user.displayName || list.user.name}</span>
           <div className={styles.listMeta}>
              <span>{list._count.items} games</span>
              <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}><Heart size={14}/> {list._count.likes}</span>
           </div>
        </div>
     </Link>
   );

   const renderGameCard = (game: any, countLabel: string, countValue: number) => (
      <Link href={`/games/${game.id}`} key={game.id} className={styles.listCard}>
         <div className={styles.listCoverWrapper}>
            {game.coverUrl ? (
              <Image src={game.coverUrl} alt="Cover" fill sizes="(max-width: 768px) 150px, 200px" style={{objectFit: 'cover'}} />
            ) : (
              <div className={styles.placeholderListCover}></div>
            )}
         </div>
         <div className={styles.listCardContent}>
            <h3>{game.title}</h3>
            <span className={styles.listAuthor}>{game.developer}</span>
            <div className={styles.listMeta}>
               <span>{countValue} {countLabel}</span>
            </div>
         </div>
      </Link>
   );

   return (
     <div className={`container ${styles.communityContainer}`}>
        <div className={styles.heroSection}>
           <h1>Community Hub</h1>
           <p>Discover the greatest curated Nintendo 64 lists from players worldwide.</p>
        </div>

        {topLists.length > 0 && (
           <div className={styles.boardSection}>
              <h2 style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Flame size={20} style={{color: '#ff6200'}} /> Most Liked Lists</h2>
              <div className={styles.listGrid}>{topLists.map(renderListCard)}</div>
           </div>
        )}

        {mostCompletedGames.length > 0 && (
           <div className={styles.boardSection}>
              <h2 style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Trophy size={20} style={{color: '#ffd700'}} /> Most Completed Games</h2>
              <div className={styles.listGrid}>{mostCompletedGames.map(g => renderGameCard(g, 'Global Completions', g.completedCount))}</div>
           </div>
        )}

        {mostPlayedGames.length > 0 && (
           <div className={styles.boardSection}>
              <h2 style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Gamepad2 size={20} style={{color: '#4fc3f7'}} /> Most Active / Currently Playing</h2>
              <div className={styles.listGrid}>{mostPlayedGames.map(g => renderGameCard(g, 'Active Trackers', g.playedCount))}</div>
           </div>
        )}

        {recentLists.length > 0 && (
           <div className={styles.boardSection}>
              <h2 style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Sparkles size={20} className={styles.purpleIcon} /> Recently Created Curations</h2>
              <div className={styles.listGrid}>{recentLists.map(renderListCard)}</div>
           </div>
        )}
        
        {topLists.length === 0 && (
           <div style={{textAlign: 'center', color: '#888', padding: '4rem'}}>
              No public lists have been created yet. Be the first!
           </div>
        )}
     </div>
   )
}
