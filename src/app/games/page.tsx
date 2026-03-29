import { searchN64Games } from '@/actions/igdb';
import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function GamesPage(props: { searchParams: Promise<{ q?: string, genre?: string, company?: string, sort?: string, page?: string }> }) {
  const searchParams = await props.searchParams;
  const { q, genre, company, sort } = searchParams;
  const page = parseInt(searchParams.page || '1', 10);
  
  const games = await searchN64Games({ q, genre, company, sort, page });

  const buildQueryParams = (newPage: number) => {
      const sp = new URLSearchParams();
      if (q) sp.set('q', q);
      if (genre) sp.set('genre', genre);
      if (company) sp.set('company', company);
      if (sort) sp.set('sort', sort);
      sp.set('page', String(newPage));
      return sp.toString();
  };

  const getCoverUrl = (url?: string) => {
    if (!url) return null;
    return `https:${url.replace('t_thumb', 't_cover_big')}`;
  };

  return (
    <div className={`container ${styles.gamesContainer}`}>
      <div className={styles.searchHeader}>
        <h1>MyN64List</h1>
        
        <form className={styles.searchForm}>
          <input 
            type="text" 
            name="q" 
            defaultValue={q || ''} 
            placeholder="Search Nintendo 64 games..." 
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchBtn}>Search</button>

          <div className={styles.filtersRow}>
            <select name="sort" defaultValue={sort || 'reviews_desc'} className={styles.filterSelect} disabled={!!q} title={!!q ? "Sorting is disabled while searching by text" : ""}>
              <option value="reviews_desc">Number of Reviews</option>
              <option value="rating_desc">Twitch Rating (High to Low)</option>
              <option value="date_desc">Release Date (Newest)</option>
              <option value="date_asc">Release Date (Oldest)</option>
              <option value="name_asc">Alphabetical (A-Z)</option>
              <option value="name_desc">Alphabetical (Z-A)</option>
              <option value="n64db_rating">N64DB Rating (Coming Soon)</option>
            </select>
          </div>
          
          {/* Preserve clicked tag filters in hidden inputs so forms don't strip them */}
          {genre && <input type="hidden" name="genre" value={genre} />}
          {company && <input type="hidden" name="company" value={company} />}
        </form>

        <div className={styles.activeFilters}>
          {genre && <span className={styles.activeTag}>Genre: {genre} <Link href={`/games?q=${q||''}&sort=${sort||''}`}>&times;</Link></span>}
          {company && <span className={styles.activeTag}>Company: {company} <Link href={`/games?q=${q||''}&sort=${sort||''}`}>&times;</Link></span>}
        </div>
      </div>

      <div className={styles.resultsGrid}>
        {games.length === 0 ? (
          <div className={styles.noResults}>No games found matching your criteria.</div>
        ) : (
          games.map((game: any) => (
            <Link href={`/games/${game.id}`} key={game.id} className={styles.gameCard}>
              <div className={styles.cardImage}>
                {game.cover?.url ? (
                  <Image src={getCoverUrl(game.cover.url)!} alt={game.name} fill sizes="(max-width: 768px) 100vw, 200px" style={{objectFit: 'cover'}} />
                ) : (
                  <div className={styles.noImage}>No Cover</div>
                )}
              </div>
              <div className={styles.cardContent}>
                <h3>{game.name}</h3>
                <p>{game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : 'Unknown'}</p>
                <div className={styles.cardMetaStats} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}><Star size={14} /> {game.rating ? (game.rating / 10).toFixed(1) : '-'}</span>
                  <span>{game.rating_count ? `(${game.rating_count})` : ''}</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className={styles.paginationRow} style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', marginTop: '3rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem'}}>
         {page > 1 ? (
             <Link href={`/games?${buildQueryParams(page - 1)}`} className={styles.searchBtn} style={{background: 'var(--bg-content)', color: 'var(--text-main)', border: '1px solid var(--border-color)'}}>&larr; Previous Page</Link>
         ) : <button disabled className={styles.searchBtn} style={{background: 'transparent', opacity: 0.5, border: '1px solid var(--border-color)', cursor: 'not-allowed'}}>&larr; Previous Page</button>}
         
         <span style={{fontWeight: 'bold', fontSize: '1.1rem'}}>Page {page}</span>
         
         {games.length === 20 ? (
             <Link href={`/games?${buildQueryParams(page + 1)}`} className={styles.searchBtn}>Next Page &rarr;</Link>
         ) : <button disabled className={styles.searchBtn} style={{background: 'transparent', opacity: 0.5, border: '1px solid var(--border-color)', cursor: 'not-allowed'}}>Next Page &rarr;</button>}
      </div>

    </div>
  );
}
