'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { updateListItemOrderAction } from '@/actions/list';
import { GripVertical } from 'lucide-react';
import styles from './SortableList.module.css';
import Image from 'next/image';
import Link from 'next/link';
import { InlineStarRating, InlineStatusSelect } from './InlineEditors';
import { OwnerRowActions } from './ListInteractions';

export type SortableListEntry = {
  id: string;        // ListItem.id
  gameId: number;
  order: number;
  coverGameId?: number | null; // for List cover detection
  updatedAt: Date;
  game: {
    id: number;
    title: string;
    coverUrl: string | null;
  };
  userGame?: {
    score: number | null;
    status: string;
    customStatus: string | null;
  } | null;
};

function SortableRow({ entry, listId, coverGameId }: { entry: SortableListEntry; listId: string; coverGameId: number | null | undefined }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  } as React.CSSProperties;

  const ug = entry.userGame || { score: null, status: 'PLAN_TO_PLAY', customStatus: null };

  return (
    <div ref={setNodeRef} style={style} className={styles.sortableRow}>
      <button className={styles.dragHandle} {...attributes} {...listeners} aria-label="Drag to reorder">
        <GripVertical size={18} />
      </button>

      {/* Inline row content */}
      <div className={styles.gameCol}>
        <div className={styles.tinyCover}>
          {entry.game.coverUrl ? (
            <Image src={entry.game.coverUrl} alt="Cover" width={38} height={52} style={{ objectFit: 'cover', borderRadius: '3px' }} />
          ) : (
            <div className={styles.placeholderCover} />
          )}
        </div>
        <div className={styles.gameTitleBlock}>
          <Link href={`/games/${entry.game.id}`} className={styles.gameLink}>{entry.game.title}</Link>
          <span className={styles.dateAdded}>Updated {new Date(entry.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className={styles.scoreCol}>
        <InlineStarRating gameId={entry.gameId} currentScore={ug.score} />
      </div>

      <div className={styles.statusCol}>
        <InlineStatusSelect gameId={entry.gameId} currentStatus={ug.status as any} customStatus={ug.customStatus} />
      </div>

      <div className={styles.actionCol}>
        <OwnerRowActions listId={listId} gameId={entry.gameId} isCurrentCover={coverGameId === entry.gameId} />
      </div>
    </div>
  );
}

export default function SortableList({
  listId,
  initialItems,
  coverGameId,
}: {
  listId: string;
  initialItems: SortableListEntry[];
  coverGameId?: number | null;
}) {
  const [items, setItems] = useState(initialItems);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    const orderPayload = reordered.map((item, idx) => ({ id: item.id, order: idx }));
    setIsSaving(true);
    await updateListItemOrderAction(listId, orderPayload);
    setIsSaving(false);
  };

  return (
    <div className={styles.wrapper}>
      {isSaving && <div className={styles.savingBadge}>Saving order…</div>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map(entry => (
            <SortableRow key={entry.id} entry={entry} listId={listId} coverGameId={coverGameId} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
