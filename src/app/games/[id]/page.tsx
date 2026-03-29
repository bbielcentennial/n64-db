import { getN64GameById } from '@/actions/igdb';
import { Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';
import { notFound } from 'next/navigation';
import TrackGameForm from '@/components/TrackGameForm';
import { getUserGameStatus, getUserLists } from '@/actions/list';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import ReviewSection from '@/components/ReviewSection';

export const dynamic = 'force-dynamic';

const REGION_MAP: Record<number, string> = {
  1: 'EU', 2: 'NA', 3: 'AU', 4: 'NZ',
  5: 'JP', 6: 'CH', 7: 'AS', 8: 'WW'
};

const REGION_FULL_MAP: Record<number, string> = {
  1: 'Europe', 2: 'North America', 3: 'Australia', 4: 'New Zealand',
  5: 'Japan', 6: 'China', 7: 'Asia', 8: 'Worldwide'
};

const ESRB_RATING_MAP: Record<number, string> = {
  8: 'E (Everyone)', 9: 'E10+', 10: 'T (Teen)', 11: 'M (Mature)', 12: 'AO (Adults Only)'
};

export default async function GameDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const game = await getN64GameById(params.id);

  if (!game) {
    notFound();
  }

  const session = await auth();
  const userLists = await getUserLists();
  const trackedItems = await getUserGameStatus(game.id);

  const reviews = await prisma.review.findMany({
    where: { gameId: game.id },
    include: { user: { select: { id: true, name: true, displayName: true } } },
    orderBy: { createdAt: 'desc' }
  });

  const popularLists = await prisma.list.findMany({
    where: {
       isPublic: true,
       items: { some: { gameId: game.id } }
    },
    include: {
       user: { select: { name: true, displayName: true } },
       _count: { select: { likes: true } }
    },
    orderBy: { likes: { _count: 'desc' } },
    take: 5
  });

  const getCoverUrl = (url?: string) => url ? `https:${url.replace('t_thumb', 't_cover_big')}` : null;
  const getScreenshotUrl = (url?: string) => url ? `https:${url.replace('t_thumb', 't_screenshot_med')}` : null;
  const getLogoUrl = (url?: string) => url ? `https:${url.replace('t_thumb', 't_logo_med')}` : null;

  const coverUrl = getCoverUrl(game.cover?.url);
  
  // Extract Developers & Publishers
  const developers = game.involved_companies?.filter((c: any) => c.developer).map((c: any) => c.company?.name).join(', ') || 'Unknown Developer';
  const logoUrl = getLogoUrl(game.involved_companies?.find((c: any) => c.company?.logo?.url)?.company?.logo?.url);
  
  // Parse Age Ratings (ESRB Category = 1)
  const esrbData = game.age_ratings?.find((r: any) => r.category === 1);
  const esrbString = esrbData ? ESRB_RATING_MAP[esrbData.rating] || 'Unknown ESRB' : 'Not Rated';

  // Parse Language Supports (If Available)
  const languages = game.language_supports ? Array.from(new Set(game.language_supports.map((lang: any) => lang.language?.name))).join(', ') : 'Unknown';

  // Short Regions format: "NA: 1996 | JP: 1996"
  const uniqueRegions = new Set();
  const shortReleases = game.release_dates?.sort((a: any, b: any) => a.date - b.date).filter((rd: any) => {
     if (!rd.y || uniqueRegions.has(rd.region)) return false;
     uniqueRegions.add(rd.region);
     return true;
  }).map((rd: any) => `${REGION_MAP[rd.region] || 'Unknown'}: ${rd.y}`);

  return (
    <div className={`container ${styles.detailContainer}`}>
      <Link href="/games" className={styles.backLink}>&larr; Back to Search</Link>
      
      <div className={styles.headerArea}>
        <div className={styles.coverWrapper}>
           {coverUrl ? <Image src={coverUrl} alt={game.name} fill sizes="(max-width: 768px) 100vw, 225px" style={{objectFit: 'cover', borderRadius: '4px'}} /> : <div className={styles.noCover}>No Image</div>}
        </div>
        <div className={styles.infoArea}>
          <h1>{game.name}</h1>
          <div className={styles.metaRow}>
            <span>{developers}</span>
            <span>•</span>
            <span className={styles.esrbBadge}>{esrbString}</span>
          </div>
          
          <div className={styles.shortReleases}>
            {shortReleases && shortReleases.length > 0 ? shortReleases.join(' | ') : 'Release dates unknown'}
          </div>
          
          <div className={styles.tags}>
            {game.genres?.map((g: any) => (
               <Link href={`/games?genre=${encodeURIComponent(g.name)}`} key={g.name} className={styles.tag}>{g.name}</Link>
            ))}
          </div>

          <div className={styles.ratingBox}>
            <span className={styles.score}>{game.rating ? (game.rating / 10).toFixed(1) : 'N/A'}</span>
            <div className={styles.scoreText}>
               <span className={styles.scoreLabel}>Community Rating</span>
               <span className={styles.ratingCount}>({game.rating_count ? game.rating_count : 0} reviews)</span>
            </div>
            {logoUrl && (
              <div className={styles.devLogoBox}>
                 <Image src={logoUrl} alt="Developer Logo" width={80} height={40} style={{objectFit: 'contain'}} />
              </div>
            )}
          </div>

          <TrackGameForm 
            gameId={game.id} 
            gameName={game.name}
            userLists={userLists} 
            userGame={trackedItems?.userGame || null}
            activeListIds={trackedItems?.listItems || []}
          />

          {popularLists.length > 0 && (
             <div className={styles.popularListsBlock}>
                <h3>Popular Lists it appears on</h3>
                <ul>
                   {popularLists.map(pl => (
                      <li key={pl.id}>
                         <Link href={`/list/${pl.id}`} className={styles.plLink}>{pl.title}</Link>
                         <div className={styles.plMeta}>
                           by {pl.user.displayName || pl.user.name} <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}><Heart size={14}/> {pl._count.likes}</span>
                         </div>
                      </li>
                   ))}
                </ul>
             </div>
          )}
        </div>
      </div>

      <div className={styles.contentArea}>
        <h2>Summary</h2>
        <p className={styles.summaryText}>{game.summary || 'No summary available for this title.'}</p>

        {game.screenshots?.length > 0 && (
          <>
            <h2>Screenshots</h2>
            <div className={styles.screenshotsGrid}>
              {game.screenshots.map((s: any) => (
                <div key={s.url} className={styles.screenshotFrame}>
                  <Image src={getScreenshotUrl(s.url)!} alt="Screenshot" fill sizes="(max-width: 768px) 100vw, 300px" style={{objectFit: 'cover'}} />
                </div>
              ))}
            </div>
          </>
        )}

        <h2 className={styles.tableHeader}>Deep Metadata</h2>
        <table className={styles.dataTable}>
          <tbody>
             <tr>
               <th>Supported Languages</th>
               <td>{languages}</td>
             </tr>
          </tbody>
        </table>

        {/* Full Regional Release Table */}
        <h2 className={styles.tableHeader}>Regional Releases</h2>
        {game.release_dates && game.release_dates.length > 0 ? (
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Region</th>
                <th>Exact Date</th>
              </tr>
            </thead>
            <tbody>
               {game.release_dates.sort((a: any, b: any) => a.date - b.date).map((rd: any, idx: number) => (
                  <tr key={idx}>
                    <td>{REGION_FULL_MAP[rd.region] || 'Unknown Region'}</td>
                    <td>{rd.date ? new Date(rd.date * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'TBA'}</td>
                  </tr>
               ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.textMuted}>No detailed release information found.</p>
        )}
      </div>

      <ReviewSection
        gameId={game.id}
        reviews={reviews as any}
        sessionUserId={session?.user?.id || null}
      />
    </div>
  );
}
