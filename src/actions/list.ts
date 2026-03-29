'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { getN64GameById } from './igdb';

export async function getUserLists() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const lists = await prisma.list.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, title: true }
  });

  return lists;
}

export async function getUserGameStatus(gameId: number) {
  const session = await auth();
  if (!session?.user?.id) return { userGame: null, listItems: [] };

  const userGame = await prisma.userGame.findUnique({
     where: { userId_gameId: { userId: session.user.id, gameId } }
  });

  const listItems = await prisma.listItem.findMany({
    where: { gameId, list: { userId: session.user.id } },
    select: { listId: true }
  });

  return { userGame, listItems: listItems.map(li => li.listId) };
}

export async function trackGameInListAction(data: { gameId: number, listId: string, status: any, score?: number }) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'You must be logged in to track games.' };
  }

  const { gameId, listId, status, score } = data;

  try {
    // 1. Ensure the Game exists locally in our Postgres DB 
    const localGame = await prisma.game.findUnique({ where: { id: gameId } });
    if (!localGame) {
       const igdbGame = await getN64GameById(gameId.toString());
       if (!igdbGame) return { error: 'Game not found on IGDB.' };
       
       const developers = igdbGame.involved_companies?.filter((c: any) => c.developer).map((c: any) => c.company?.name).join(', ') || 'Unknown';
       const genres = igdbGame.genres?.map((g: any) => g.name).join(', ') || '';
       const releaseDate = igdbGame.first_release_date ? new Date(igdbGame.first_release_date * 1000) : null;
       const coverUrl = igdbGame.cover?.url ? `https:${igdbGame.cover.url.replace('t_thumb', 't_cover_big')}` : null;

       await prisma.game.create({
         data: {
           id: igdbGame.id,
           title: igdbGame.name,
           coverUrl,
           releaseDate,
           developer: developers,
           summary: igdbGame.summary,
           genres
         }
       });
    }

    // 2. Validate user owns the list
    const userList = await prisma.list.findUnique({ where: { id: listId } });
    if (!userList || userList.userId !== session.user.id) {
        return { error: 'Invalid List selected.' };
    }

    // 3. Upsert the ListItem into their chosen list
    await prisma.listItem.upsert({
      where: { listId_gameId: { listId, gameId } },
      update: {},
      create: { listId, gameId }
    });

    // 4. Upsert the Master Collection UserGame to retain ratings unconditionally
    const existingUG = await prisma.userGame.findUnique({ where: { userId_gameId: { userId: session.user.id, gameId } } });
    
    await prisma.userGame.upsert({
       where: { userId_gameId: { userId: session.user.id, gameId } },
       update: { status, score: score || null },
       create: { userId: session.user.id, gameId, status, score: score || null }
    });

    await syncGameAggregations(gameId, existingUG?.status, status);

    revalidatePath(`/games/${gameId}`);
    return { success: true };

  } catch (err: any) {
    console.error("Tracking Error:", err);
    return { error: err.message || 'An error occurred while tracking.' };
  }
}

export async function createListAction(data: { title: string, description?: string, isPublic: boolean }) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  try {
    const list = await prisma.list.create({
      data: {
        userId: session.user.id,
        title: data.title,
        description: data.description,
        isPublic: data.isPublic
      }
    });
    revalidatePath(`/user/${session.user.id}`);
    return { success: true, listId: list.id };
  } catch(e: any) {
    return { error: e.message };
  }
}

export async function toggleListLikeAction(listId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  try {
     const existing = await prisma.listLike.findUnique({
        where: { userId_listId: { userId: session.user.id, listId } }
     });
     if (existing) {
        await prisma.listLike.delete({ where: { userId_listId: { userId: session.user.id, listId } } });
     } else {
        await prisma.listLike.create({ data: { userId: session.user.id, listId } });
     }
     revalidatePath(`/list/${listId}`);
     return { success: true };
  } catch (e: any) { return { error: e.message }; }
}

export async function toggleListFollowAction(listId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  try {
     const existing = await prisma.listFollow.findUnique({
        where: { userId_listId: { userId: session.user.id, listId } }
     });
     if (existing) {
        await prisma.listFollow.delete({ where: { userId_listId: { userId: session.user.id, listId } } });
     } else {
        await prisma.listFollow.create({ data: { userId: session.user.id, listId } });
     }
     revalidatePath(`/list/${listId}`);
     revalidatePath(`/user/${session.user.id}`);
     return { success: true };
  } catch (e: any) { return { error: e.message }; }
}

export async function setListCoverAction(listId: string, coverGameId: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (list?.userId !== session.user.id) return { error: 'Not the owner' };

  await prisma.list.update({ where: { id: listId }, data: { coverGameId } });
  revalidatePath(`/list/${listId}`);
  revalidatePath(`/user/${session.user.id}`);
  return { success: true };
}
async function ensureLocalGameExists(gameId: number) {
  const localGame = await prisma.game.findUnique({ where: { id: gameId } });
  if (!localGame) {
     const igdbGame = await getN64GameById(gameId.toString());
     if (!igdbGame) throw new Error('Game not found on IGDB.');
     
     const developers = igdbGame.involved_companies?.filter((c: any) => c.developer).map((c: any) => c.company?.name).join(', ') || 'Unknown';
     const genres = igdbGame.genres?.map((g: any) => g.name).join(', ') || '';
     const releaseDate = igdbGame.first_release_date ? new Date(igdbGame.first_release_date * 1000) : null;
     const coverUrl = igdbGame.cover?.url ? `https:${igdbGame.cover.url.replace('t_thumb', 't_cover_big')}` : null;

     await prisma.game.create({
       data: {
         id: igdbGame.id,
         title: igdbGame.name,
         coverUrl,
         releaseDate,
         developer: developers,
         summary: igdbGame.summary,
         genres
       }
     });
  }
}

async function syncGameAggregations(gameId: number, prevStatus: string | undefined | null, newStatus: string | undefined | null) {
   if (prevStatus === newStatus) return;

   const increment: any = Object.assign({},
       newStatus === 'COMPLETED' ? { completedCount: { increment: 1 } } : {},
       newStatus === 'PLAYING' ? { playedCount: { increment: 1 } } : {}
   );
   const decrement: any = Object.assign({},
       prevStatus === 'COMPLETED' ? { completedCount: { decrement: 1 } } : {},
       prevStatus === 'PLAYING' ? { playedCount: { decrement: 1 } } : {}
   );

   const updateData = { ...increment, ...decrement };
   if (Object.keys(updateData).length > 0) {
       await prisma.game.update({ where: { id: gameId }, data: updateData }).catch(() => {});
   }
}

async function logUserAction(userId: string, actionType: string, details: any) {
  try {
     await prisma.userActionLog.create({
        data: { userId, actionType, details: JSON.stringify(details) }
     });
  } catch (e) {
     console.error("Failed to log action:", e);
  }
}

export async function updateListItemOrderAction(listId: string, itemOrders: { id: string, order: number }[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (list?.userId !== session.user.id) return { error: 'Not the owner' };

  const transactions = itemOrders.map(item => 
     prisma.listItem.update({
        where: { id: item.id },
        data: { order: item.order }
     })
  );

  await prisma.$transaction(transactions);

  revalidatePath(`/list/${listId}`);
  return { success: true };
}

export async function updateUserGameAction(gameId: number, data: { score?: number | null, status?: any, customStatus?: string | null }) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  await ensureLocalGameExists(gameId);

  const existing = await prisma.userGame.findUnique({ where: { userId_gameId: { userId: session.user.id, gameId } } });

  await prisma.userGame.upsert({
     where: { userId_gameId: { userId: session.user.id, gameId } },
     update: data,
     create: { userId: session.user.id, gameId, ...data }
  });

  if (data.status !== undefined) {
      await syncGameAggregations(gameId, existing?.status, data.status);
  }

  const game = await prisma.game.findUnique({ where: { id: gameId }});

  await logUserAction(session.user.id, 'UPDATE_SCORE', {
     gameId,
     gameTitle: game?.title,
     prevScore: existing?.score,
     newScore: data.score !== undefined ? data.score : existing?.score,
     prevStatus: existing?.status,
     newStatus: data.status !== undefined ? data.status : existing?.status
  });

  revalidatePath(`/user/${session.user.id}/all`);
  revalidatePath(`/user/${session.user.id}`);
  return { success: true };
}

export async function clearRatingAction(gameId: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const existing = await prisma.userGame.findUnique({ where: { userId_gameId: { userId: session.user.id, gameId } } });
  
  await prisma.userGame.delete({
     where: { userId_gameId: { userId: session.user.id, gameId } }
  }).catch(() => {});

  await syncGameAggregations(gameId, existing?.status, null);

  // Remove from all custom lists
  await prisma.listItem.deleteMany({
     where: { gameId, list: { userId: session.user.id } }
  });

  const game = await prisma.game.findUnique({ where: { id: gameId }});

  await logUserAction(session.user.id, 'CLEAR_RATING', {
     gameId,
     gameTitle: game?.title,
     score: existing?.score,
     status: existing?.status
  });

  revalidatePath(`/user/${session.user.id}/all`);
  revalidatePath(`/user/${session.user.id}`);
  return { success: true };
}

export async function removeGameFromListAction(listId: string, gameId: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (list?.userId !== session.user.id) return { error: 'Not the owner' };

  await prisma.listItem.delete({ where: { listId_gameId: { listId, gameId } } }).catch(()=>{});
  const game = await prisma.game.findUnique({ where: { id: gameId }});
  await logUserAction(session.user.id, 'REMOVE_FROM_LIST', { gameId, gameTitle: game?.title, listId, listTitle: list.title });
  revalidatePath(`/list/${listId}`);
  revalidatePath(`/user/${session.user.id}`);
  return { success: true };
}

export async function toggleGameInListAction(listId: string, gameId: number, isAdded: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (list?.userId !== session.user.id) return { error: 'Not the owner' };

  await ensureLocalGameExists(gameId);

  if (isAdded) {
     await prisma.listItem.upsert({
        where: { listId_gameId: { listId, gameId } },
        create: { listId, gameId },
        update: {}
     });
     
     // Ensure Global wrapper tracking applies immediately globally securely
     const existingUG = await prisma.userGame.findUnique({ where: { userId_gameId: { userId: session.user.id, gameId } } });
     if (!existingUG) {
         await prisma.userGame.create({ data: { userId: session.user.id, gameId }});
     }

     const game = await prisma.game.findUnique({ where: { id: gameId }});
     await logUserAction(session.user.id, 'ADD_TO_LIST', { gameId, gameTitle: game?.title, listId, listTitle: list.title });
  } else {
     await prisma.listItem.delete({ where: { listId_gameId: { listId, gameId } } }).catch(() => {});
     
     const game = await prisma.game.findUnique({ where: { id: gameId }});
     await logUserAction(session.user.id, 'REMOVE_FROM_LIST', { gameId, gameTitle: game?.title, listId, listTitle: list.title });
  }
  revalidatePath(`/list/${listId}`);
  revalidatePath(`/user/${session.user.id}/all`);
  return { success: true };
}

export async function undoUserActionAction(logId: string) {
   const session = await auth();
   if (!session?.user?.id) return { error: 'Unauthorized' };

   const log = await prisma.userActionLog.findUnique({ where: { id: logId } });
   if (!log || log.userId !== session.user.id || log.isUndone) return { error: 'Cannot undo' };

   const details = JSON.parse(log.details);

   if (log.actionType === 'UPDATE_SCORE') {
      await prisma.userGame.update({
         where: { userId_gameId: { userId: session.user.id, gameId: details.gameId } },
         data: { score: details.prevScore, status: details.prevStatus || 'PLAN_TO_PLAY' }
      });
      await syncGameAggregations(details.gameId, details.newStatus, details.prevStatus || 'PLAN_TO_PLAY');
   } else if (log.actionType === 'ADD_TO_LIST') {
      await prisma.listItem.delete({ where: { listId_gameId: { listId: details.listId, gameId: details.gameId } } }).catch(()=>{});
   } else if (log.actionType === 'REMOVE_FROM_LIST') {
      await prisma.listItem.create({ data: { listId: details.listId, gameId: details.gameId } }).catch(()=>{});
      
      const existingUG = await prisma.userGame.findUnique({ where: { userId_gameId: { userId: session.user.id, gameId: details.gameId } } });
      if (!existingUG) {
         await prisma.userGame.create({ data: { userId: session.user.id, gameId: details.gameId }});
      }
   } else if (log.actionType === 'CLEAR_RATING') {
      await prisma.userGame.create({
         data: { userId: session.user.id, gameId: details.gameId, score: details.score, status: details.status || 'PLAN_TO_PLAY' }
      }).catch(()=>{});
      await syncGameAggregations(details.gameId, null, details.status || 'PLAN_TO_PLAY');
   }

   await prisma.userActionLog.update({ where: { id: logId }, data: { isUndone: true } });

   revalidatePath(`/user/${session.user.id}/all`);
   revalidatePath(`/user/${session.user.id}`);
   return { success: true };
}
