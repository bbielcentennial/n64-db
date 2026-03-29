import prisma from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from './page.module.css';
import { auth } from '@/auth';
import { ListLikeFollowUI, OwnerRowActions } from '@/components/ListInteractions';
import { InlineStarRating, InlineStatusSelect } from '@/components/InlineEditors';
import SortableList from '@/components/SortableList';

export const dynamic = 'force-dynamic';

export default async function ListPage(props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const params = await props.params;
  const viewerId = session?.user?.id;
  
  const list = await prisma.list.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      items: {
         include: { game: true },
         orderBy: { order: 'asc' }
      },
      likes: { where: { userId: viewerId || '' } },
      follows: { where: { userId: viewerId || '' } },
      _count: { select: { likes: true, follows: true, items: true } }
    }
  });

  if (!list) notFound();
  
  // If private and not owner
  const isOwner = viewerId === list.userId;
  if (!list.isPublic && !isOwner) {
    return (
       <div className={`container ${styles.privateNotice}`}>
         <h2>Private List</h2>
         <p>This collection is kept secret by its creator.</p>
         <Link href="/community">&larr; Back to Community</Link>
       </div>
    );
  }

  const isLiked = list.likes.length > 0;
  const isFollowed = list.follows.length > 0;

  const userGames = await prisma.userGame.findMany({
      where: {
         userId: list.userId,
         gameId: { in: list.items.map((i: any) => i.gameId) }
      }
  });

  // Merge userGame data into items for the SortableList (serializable plain objects)
  const enrichedItems = list.items.map((item: any) => {
    const ug = userGames.find((u: any) => u.gameId === item.gameId);
    return {
      id: item.id,
      gameId: item.gameId,
      order: item.order,
      updatedAt: item.updatedAt,
      game: { id: item.game.id, title: item.game.title, coverUrl: item.game.coverUrl },
      userGame: ug ? { score: ug.score, status: ug.status, customStatus: ug.customStatus } : null,
    };
  });

  const renderGameRow = (item: any) => {
    const ug = userGames.find((u: any) => u.gameId === item.gameId) || { score: null, status: 'PLAN_TO_PLAY', customStatus: null };

    return (
      <div key={item.id} className={styles.listRow}>
         <div className={styles.gameCol}>
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
         <div className={styles.scoreCol}>
            <span className={ug.score ? styles.scoreBadge : styles.noScore}>{ug.score ? `${ug.score} / 10` : '-'}</span>
         </div>
         <div className={styles.statusCol}>
             <span className={`${styles.statusBadge} ${styles[ug.status]}`}>{ug.status === 'CUSTOM' ? ug.customStatus : ug.status.replace(/_/g, ' ')}</span>
         </div>
      </div>
    );
  };

  return (
    <div className={`container ${styles.listContainer}`}>
       <div className={styles.listHeader}>
          <div className={styles.headerTitles}>
             <h1>{list.title}</h1>
             <p className={styles.descriptionText}>{list.description || 'No description provided.'}</p>
             <Link href={`/user/${list.userId}`} className={styles.authorLink}>Created by {list.user.displayName || list.user.name}</Link>
          </div>
          <div className={styles.socialBlock}>
             <div className={styles.stats}>
                <span>{list._count.items} Games</span> • 
                <span>{list._count.likes} Likes</span> • 
                <span>{list._count.follows} Followers</span>
             </div>
             {viewerId && (
                <ListLikeFollowUI listId={list.id} isLiked={isLiked} isFollowed={isFollowed} isOwner={isOwner} />
             )}
          </div>
       </div>

       <div className={styles.listBodyContainer}>
          <div className={styles.listHeaderRow}>
             {isOwner && <div style={{width: '36px'}}></div>}
             <div className={styles.gameCol}>Title</div>
             <div className={styles.scoreCol}>Score</div>
             <div className={styles.statusCol}>Status</div>
             {isOwner && <div className={styles.actionCol}>Edit</div>}
          </div>
          
          {list.items.length === 0 ? (
            <div className={styles.emptyState}>
              <p>There are no games in this list yet.</p>
              {isOwner && <Link href="/games" className={styles.browseBtn}>Browse Games to Add</Link>}
            </div>
          ) : isOwner ? (
            <div style={{position: 'relative'}}>
              <SortableList
                listId={list.id}
                initialItems={enrichedItems}
                coverGameId={list.coverGameId}
              />
            </div>
          ) : (
            <div className={styles.listBody}>
              {list.items.map(renderGameRow)}
            </div>
          )}
       </div>
    </div>
  )
}
