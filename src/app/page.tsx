import styles from './page.module.css';
import Link from 'next/link';
import Image from 'next/image';
import { getTopN64Games, getRandomN64Games } from '@/actions/igdb';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [topGames, randomGames] = await Promise.all([
    getTopN64Games(5),
    getRandomN64Games(5)
  ]);

  const getCoverUrl = (url?: string) => {
    if (!url) return null;
    return `https:${url.replace('t_thumb', 't_cover_big')}`;
  };

  return (
    <div className={`container ${styles.homeContainer}`}>
      <div className={styles.hero}>
        <h1>Welcome to MyN64List</h1>
        <p>The ultimate Nintendo 64 game database and tracking community.</p>
        <div className={styles.actions}>
          <Link href="/games" className={styles.primaryBtn}>Browse Games</Link>
        </div>
      </div>

      <div className={styles.dashboardGrid}>
        <section className={styles.listSection}>
          <div className={styles.sectionHeader}>
            <h2>🔥 High Rated N64 Games</h2>
          </div>
          <div className={styles.malList}>
            {topGames.map((game: any, index: number) => {
              const coverUrl = getCoverUrl(game.cover?.url);
              return (
                <div key={game.id} className={styles.listItem}>
                  <div className={styles.itemRank}>{index + 1}</div>
                  <div className={styles.itemCoverPlaceholder}>
                    {coverUrl ? (
                      <Image 
                        src={coverUrl} 
                        alt={game.name} 
                        width={40} 
                        height={56} 
                        style={{objectFit: 'cover', borderRadius: '2px'}} 
                        unoptimized={false}
                      />
                    ) : null}
                  </div>
                  <div className={styles.itemInfo}>
                    <Link href={`/games/${game.id}`} className={styles.itemTitle}>{game.name}</Link>
                    <span className={styles.itemMeta}>
                      {game.genres?.[0]?.name || 'Nintendo 64'} • {game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : 'Unknown'}
                    </span>
                  </div>
                  <div className={styles.itemScore}>
                    ⭐ {game.rating ? (game.rating / 10).toFixed(1) : '-'}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className={styles.listSection}>
          <div className={styles.sectionHeader}>
            <h2>🎲 Random Games</h2>
            <Link href="/games" className={styles.viewMore}>View All</Link>
          </div>
          <div className={styles.malList}>
            {randomGames.map((game: any) => {
               const coverUrl = getCoverUrl(game.cover?.url);
               return (
                <div key={game.id} className={styles.listItem}>
                  <div className={styles.itemRank}>-</div>
                  <div className={styles.itemCoverPlaceholder}>
                     {coverUrl ? (
                      <Image 
                        src={coverUrl} 
                        alt={game.name} 
                        width={40} 
                        height={56} 
                        style={{objectFit: 'cover', borderRadius: '2px'}} 
                      />
                    ) : null}
                  </div>
                  <div className={styles.itemInfo}>
                    <Link href={`/games/${game.id}`} className={styles.itemTitle}>{game.name}</Link>
                    <span className={styles.itemMeta}>
                      {game.genres?.[0]?.name || 'Nintendo 64'} • {game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : 'Unknown'}
                    </span>
                  </div>
                  <div className={styles.itemScore}>
                    ⭐ {game.rating ? (game.rating / 10).toFixed(1) : '-'}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
