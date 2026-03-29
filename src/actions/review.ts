'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function createReviewAction(gameId: number, content: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'You must be logged in to write a review.' };

  if (content.trim().length < 15) {
    return { error: 'Review must be at least 15 characters long.' };
  }

  // One review per user per game
  const existing = await prisma.review.findFirst({
    where: { userId: session.user.id, gameId }
  });
  if (existing) {
    return { error: 'You have already reviewed this game. Delete your existing review to write a new one.' };
  }

  await prisma.review.create({
    data: {
      userId: session.user.id,
      gameId,
      content: content.trim()
    }
  });

  revalidatePath(`/games/${gameId}`);
  return { success: true };
}

export async function deleteReviewAction(reviewId: string, gameId: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review || review.userId !== session.user.id) return { error: 'Not your review.' };

  await prisma.review.delete({ where: { id: reviewId } });

  revalidatePath(`/games/${gameId}`);
  return { success: true };
}

export async function updateReviewAction(reviewId: string, gameId: number, content: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  if (content.trim().length < 15) {
    return { error: 'Review must be at least 15 characters long.' };
  }

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review || review.userId !== session.user.id) return { error: 'Not your review.' };

  await prisma.review.update({
    where: { id: reviewId },
    data: { content: content.trim() }
  });

  revalidatePath(`/games/${gameId}`);
  return { success: true };
}
