import prisma from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Heart, Library } from 'lucide-react';
import styles from './page.module.css';
import { auth } from '@/auth';
import CreateListForm from '@/components/CreateListForm';
import { UndoActionBtn } from '@/components/UndoActionBtn';

export const dynamic = 'force-dynamic';

export default async function UserProfilePage(props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const params = await props.params;
  const isOwner = session?.user?.id === params.id;
  
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      actionLogs: {
         orderBy: { createdAt: 'desc' },
         take: 10
      },
      lists: {
        include: {
          coverGame: { select: { coverUrl: true } },
          _count: { select: { items: true, likes: true } }
        },
        orderBy: { updatedAt: 'desc' }
      },
      listFollows: {
        include: {
           list: {
              include: {
                 coverGame: { select: { coverUrl: true } },
                 user: { select: { name: true, displayName: true } },
                 _count: { select: { items: true, likes: true } }
              }
           }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!user) {
    notFound();
  }

  const renderListCard = (list: any, authorName?: string) => (
     <Link href={`/list/${list.id}`} key={list.id} className={styles.listCard}>
        <div className={styles.listCoverWrapper}>
           {list.coverGame?.coverUrl ? (
             <Image src={list.coverGame.coverUrl} alt="Cover" fill sizes="(max-width: 768px) 150px, 200px" style={{objectFit: 'cover'}} />
           ) : (
             <div className={styles.placeholderListCover}></div>
           )}
           {!list.isPublic && <div className={styles.privateBadge}>Private</div>}
        </div>
        <div className={styles.listCardContent}>
           <h3>{list.title}</h3>
           {authorName && <span className={styles.listAuthor}>by {authorName}</span>}
           <div className={styles.listMeta}>
              <span>{list._count.items} games</span>
              <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}><Heart size={14}/> {list._count.likes}</span>
           </div>
        </div>
     </Link>
  );

  const displayUser = user.displayName || user.name || "Unknown User";

  return (
    <div className={`container ${styles.profileContainer}`}>
       <div className={styles.profileHeader}>
          <div className={styles.avatar}>
            {user.avatarUrl && user.avatarUrl !== 'BLANK_AVATAR' ? (
               <Image src={user.avatarUrl} alt="Avatar" width={100} height={100} style={{borderRadius: '50%', objectFit: 'cover'}} />
            ) : (
               <div className={styles.placeholderAvatar}>{displayUser.charAt(0).toUpperCase()}</div>
            )}
          </div>
          <div className={styles.userInfo}>
            <h1>{displayUser}</h1>
            <p className={styles.userJoined}>Joined {user.emailVerified ? new Date().getFullYear() : 'Recently'}</p>
          </div>
          
          {isOwner && (
             <div className={styles.settingsLinkBlock}>
                <Link href="/settings" className={styles.settingsBtn}>Edit Profile</Link>
             </div>
          )}
       </div>

       <div className={styles.categorySection}>
          <div className={styles.sectionHeader}>
             <h2>{isOwner ? "My Curated Lists" : "Public Lists"}</h2>
             {isOwner && <CreateListForm />}
          </div>
          <div className={styles.listGrid}>
             {isOwner && (
                <Link href={`/user/${user.id}/all`} className={styles.listCard}>
                   <div className={styles.listCoverWrapper} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1f1f27, #334)'}}>
                      <Library size={48} color="rgba(255,255,255,0.3)" />
                   </div>
                   <div className={styles.listCardContent}>
                      <h3 style={{color: 'var(--accent)'}}>My Complete Collection</h3>
                      <span className={styles.listAuthor}>Private Virtual List</span>
                      <div className={styles.listMeta}>All Tracked Games</div>
                   </div>
                </Link>
             )}
             {user.lists.filter((l: any) => isOwner || l.isPublic).map((l: any) => renderListCard(l))}
          </div>
          {user.lists.filter((l: any) => isOwner || l.isPublic).length === 0 && !isOwner && (
             <p className={styles.emptyText}>No lists have been created yet.</p>
          )}
       </div>

       {isOwner && user.actionLogs && user.actionLogs.length > 0 && (
          <div className={styles.categorySection}>
             <div className={styles.sectionHeader}>
               <h2>Recent Activity</h2>
             </div>
             <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                {user.actionLogs.map((log: any) => {
                   let actionText = log.actionType.replace(/_/g, ' ');
                   let infoJSX = <p style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>System Action</p>;

                   try {
                      const d = JSON.parse(log.details);
                      const gameLink = d.gameId ? <Link href={`/games/${d.gameId}`} style={{color: 'var(--link-color)', fontWeight: 'bold'}}>{d.gameTitle || 'Unknown Game'}</Link> : null;
                      
                      if (log.actionType === 'UPDATE_SCORE') {
                         infoJSX = <p style={{fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0}}>Updated rating for {gameLink} <span style={{color: 'var(--text-main)', opacity: 0.8}}>({d.newScore || 'Unscored'} / {d.newStatus || 'Unset'})</span></p>;
                      } else if (log.actionType === 'ADD_TO_LIST') {
                         infoJSX = <p style={{fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0}}>Added {gameLink} to list: <Link href={`/list/${d.listId}`} style={{color: 'var(--text-main)'}}>{d.listTitle}</Link></p>;
                      } else if (log.actionType === 'REMOVE_FROM_LIST') {
                         infoJSX = <p style={{fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0}}>Removed {gameLink} from list: <Link href={`/list/${d.listId}`} style={{color: 'var(--text-main)'}}>{d.listTitle}</Link></p>;
                      } else if (log.actionType === 'CLEAR_RATING') {
                         infoJSX = <p style={{fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0}}>Cleared rating for {gameLink} from Master Collection.</p>;
                      }
                   } catch(e){}

                   return (
                      <div key={log.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
                         <div>
                            <strong style={{color: 'var(--accent)'}}>
                               {actionText} <span style={{fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '0.5rem'}}>— {log.createdAt.toLocaleString()}</span>
                            </strong>
                            {infoJSX}
                         </div>
                         {!log.isUndone ? (
                            <UndoActionBtn logId={log.id} />
                         ) : (
                            <span style={{color: '#aaa', fontSize: '0.8rem'}}>Undone ✓</span>
                         )}
                      </div>
                   )
                })}
             </div>
          </div>
       )}

       {user.listFollows.length > 0 && (
         <div className={styles.categorySection}>
            <div className={styles.sectionHeader}>
              <h2>Followed Community Lists</h2>
            </div>
            <div className={styles.listGrid}>
               {user.listFollows.map((f: any) => renderListCard(f.list, f.list.user.displayName ?? f.list.user.name ?? undefined))}
            </div>
         </div>
       )}
    </div>
  )
}
