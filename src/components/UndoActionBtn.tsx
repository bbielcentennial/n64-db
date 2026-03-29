'use client';
import { useTransition } from 'react';
import { undoUserActionAction } from '@/actions/list';
import { Undo2 } from 'lucide-react';

export function UndoActionBtn({ logId }: { logId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleUndo = () => {
     startTransition(async () => {
        await undoUserActionAction(logId);
     });
  };

  return (
     <button onClick={handleUndo} disabled={isPending} style={{
        background: 'none',
        border: '1px solid var(--border-color)',
        color: 'var(--text-muted)',
        borderRadius: '6px',
        padding: '0.25rem 0.5rem',
        fontSize: '0.8rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        opacity: isPending ? 0.5 : 1
     }}>
        <Undo2 size={12} /> {isPending ? 'Undoing...' : 'Undo'}
     </button>
  );
}
