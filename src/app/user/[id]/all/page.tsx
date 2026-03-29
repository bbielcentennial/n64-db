import prisma from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from '@/app/list/[id]/page.module.css';
import { auth } from '@/auth';
import { InlineStarRating, InlineStatusSelect } from '@/components/InlineEditors';
import { InlineListAssigner } from '@/components/InlineListAssigner';
import { ClearRatingBtn } from '@/components/ClearRatingBtn';

export const dynamic = 'force-dynamic';

export default async function AllGamesList(props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const params = await props.params;
  
  if (session?.user?.id !== params.id) notFound();

  const user = await prisma.user.findUnique({ where: { id: params.id }, include: { lists: { select: { id: true, title: true } } } });
  if (!user) notFound();

  const allUserGames = await prisma.userGame.findMany({
     where: { userId: params.id },
     include: { game: true },
     orderBy: { updatedAt: 'desc' }
  });

  const allListItems = await prisma.listItem.findMany({
     where: { list: { userId: params.id } }
  });

  const renderGameRow = (item: any) => {
    const activeListIds = allListItems.filter(i => i.gameId === item.gameId).map(i => i.listId);
    return (
      <div key={item.id} className={styles.listRow}>
         <div className={styles.gameCol} style={{flex: 3}}>
           <div className={styles.tinyCover}>
              {item.game.coverUrl ? (
                <Image src={item.game.coverUrl} alt="Cover" width={38} height={52} style={{objectFit: 'cover', borderRadius: '3px'}} />
              ) : (
                <div className={styles.placeholderCover}></div>
              )}
           </div>
           <div className={styles.gameTitleBlock}>
              <Link href={`/games/${item.game.id}`} className={styles.gameLink}>{item.game.title}</Link>
              <span className={styles.dateAdded}>Updated {item.updatedAt.toLocaleDateString()}</span>
           </div>
         </div>
         <div className={styles.scoreCol} style={{flex: 1.5}}>
            <InlineStarRating gameId={item.gameId} currentScore={item.score} />
         </div>
         <div className={styles.statusCol} style={{flex: 1}}>
            <InlineStatusSelect gameId={item.gameId} currentStatus={item.status} customStatus={item.customStatus} />
         </div>
         <div style={{flex: 2, textAlign: 'right', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem'}}>
            <InlineListAssigner gameId={item.gameId} userLists={user.lists} activeListIds={activeListIds} />
            <ClearRatingBtn gameId={item.gameId} />
         </div>
      </div>
    );
  };

  return (
    <div className={`container ${styles.listContainer}`}>
       <div className={styles.listHeader}>
          <div className={styles.headerTitles}>
             <h1 style={{color: 'var(--accent)'}}>My Complete Collection</h1>
             <p className={styles.descriptionText}>A private aggregate view of every single unique game you've tracked across all your lists.</p>
          </div>
          <div className={styles.socialBlock}>
             <div className={styles.stats}>
                <span>{allUserGames.length} Unique Games Tracked</span>
             </div>
          </div>
       </div>

       <div className={styles.listBodyContainer}>
          <div className={styles.listHeaderRow}>
             <div className={styles.gameCol} style={{flex: 3}}>Title</div>
             <div className={styles.scoreCol} style={{flex: 1.5}}>Universal Score</div>
             <div className={styles.statusCol} style={{flex: 1, textAlign: 'center'}}>Universal Status</div>
             <div style={{flex: 2, textAlign: 'right', paddingRight: '1rem'}}>Active Lists</div>
          </div>
          
          {allUserGames.length === 0 ? (
            <div className={styles.emptyState}>
              <p>You haven't tracked any games yet.</p>
              <Link href="/games" className={styles.browseBtn}>Browse Games</Link>
            </div>
          ) : (
            <div className={styles.listBody}>
              {allUserGames.map(renderGameRow)}
            </div>
          )}
       </div>
    </div>
  )
}
