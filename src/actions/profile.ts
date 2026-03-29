'use server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateProfileSettingsAction(data: { displayName?: string, avatarUrl?: string }) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  
  try {
     await prisma.user.update({
        where: { id: session.user.id },
        data: { 
           displayName: data.displayName || null, 
           avatarUrl: data.avatarUrl || null 
        }
     });
     revalidatePath(`/user/${session.user.id}`);
     revalidatePath('/settings');
     return { success: true };
  } catch(e: any) { 
     return { error: e.message }; 
  }
}
