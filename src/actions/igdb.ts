'use server';

let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getTwitchToken(): Promise<string> {
  const clientId = process.env.TWITCH_CLIENT_ID?.trim();
  const clientSecret = process.env.TWITCH_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET environment variables.");
  }

  if (cachedAccessToken && Date.now() < tokenExpiresAt) {
    return cachedAccessToken;
  }

  const endpoint = `https://id.twitch.tv/oauth2/token?client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials`;
  
  const response = await fetch(endpoint, { method: 'POST', cache: 'no-store' });
  const data = await response.json();

  if (!response.ok) {
    throw new Error("Failed to authenticate with Twitch: " + (data.message || JSON.stringify(data)));
  }

  cachedAccessToken = data.access_token;
  tokenExpiresAt = Date.now() + ((data.expires_in - 60) * 1000); 
  
  return cachedAccessToken!;
}

async function fetchFromIGDB(query: string) {
  const token = await getTwitchToken();
  const clientId = process.env.TWITCH_CLIENT_ID!.trim();

  const response = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      'Authorization': `Bearer ${token}`
    },
    body: query,
    cache: 'no-store'
  });

  if (!response.ok) {
      const errText = await response.text();
      throw new Error(`IGDB fetch failed: ${response.status} ${response.statusText} - ${errText}`);
  }
  
  return await response.json();
}

// Massive payload for deep metadata view
const N64_BASE_FIELDS = `
  fields id, name, cover.url, first_release_date, summary, genres.name, rating, rating_count, 
  involved_companies.company.name, involved_companies.developer, involved_companies.publisher, involved_companies.company.logo.url,
  age_ratings.category, age_ratings.rating, release_dates.date, release_dates.region, release_dates.y,
  language_supports.language.name, language_supports.language_support_type.name,
  screenshots.url;
`.replace(/\n/g, '').replace(/\s{2,}/g, ' ').trim();

export async function getTopN64Games(limit = 10) {
  const query = `${N64_BASE_FIELDS} where platforms = (4) & rating_count > 5; sort rating desc; limit ${limit};`;
  return fetchFromIGDB(query);
}

export async function getRandomN64Games(limit = 5) {
  const randomOffset = Math.floor(Math.random() * 300);
  const query = `${N64_BASE_FIELDS} where platforms = (4); limit ${limit}; offset ${randomOffset};`;
  return fetchFromIGDB(query);
}

export type SearchOptions = {
  q?: string;
  genre?: string;
  company?: string;
  sort?: string;
  page?: number;
};

export async function searchN64Games(options: SearchOptions = {}) {
  let query = '';
  
  const hasSearch = options.q && options.q.trim() !== '';

  // IGDB APICAL requires 'search' keyword at the very beginning of the query
  if (hasSearch) {
    query += `search "${options.q!.trim()}"; `;
  }

  let whereClauses = ['platforms = (4)'];

  if (options.genre) {
    whereClauses.push(`genres.name = "${options.genre}"`);
  }
  if (options.company) {
    whereClauses.push(`involved_companies.company.name = "${options.company}"`);
  }

  query += `${N64_BASE_FIELDS} where ${whereClauses.join(' & ')}; `;

  if (!hasSearch) {
      if (options.sort) {
        switch (options.sort) {
           case 'rating_desc': query += 'sort rating desc; '; break;
           case 'date_desc': query += 'sort first_release_date desc; '; break;
           case 'date_asc': query += 'sort first_release_date asc; '; break;
           case 'name_asc': query += 'sort name asc; '; break;
           case 'name_desc': query += 'sort name desc; '; break;
           case 'reviews_desc': query += 'sort rating_count desc; '; break;
           case 'n64db_rating': query += 'sort rating desc; '; break; // Placeholder for Phase 3 Local DB Join
        }
      } else {
         // Default: most reviewed N64 games
         query += 'sort rating_count desc; ';
      }
  }

  const offset = options.page ? (options.page - 1) * 20 : 0;
  if (offset > 0) query += `offset ${offset}; `;

  query += `limit 20;`;
  return fetchFromIGDB(query);
}

export async function getN64GameById(id: string) {
  const query = `${N64_BASE_FIELDS} where id = ${id} & platforms = (4); limit 1;`;
  const result = await fetchFromIGDB(query);
  return result && result.length > 0 ? result[0] : null;
}
