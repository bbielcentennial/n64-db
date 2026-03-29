'use client';
import { useTransition } from 'react';
import { clearRatingAction } from '@/actions/list';
import { Trash2 } from 'lucide-react';

export function ClearRatingBtn({ gameId }: { gameId: number }) {
  const [isPending, startTransition] = useTransition();

  const handleClear = () => {
     if (window.confirm("Are you sure you want to completely erase this game's rating and remove it from all your custom lists?")) {
        startTransition(async () => {
           await clearRatingAction(gameId);
        });
     }
  };

  return (
     <button onClick={handleClear} disabled={isPending} style={{
        background: 'none',
        border: 'none',
        color: 'var(--text-muted)',
        padding: '0.4rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isPending ? 0.5 : 1,
        transition: 'color 0.2s',
     }} title="Completely remove rating and un-list">
        <Trash2 size={16} />
     </button>
  );
}
