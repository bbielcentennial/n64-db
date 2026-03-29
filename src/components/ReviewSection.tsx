'use client';

import { useState, useTransition } from 'react';
import { createReviewAction, deleteReviewAction, updateReviewAction } from '@/actions/review';
import { Trash2, Pencil, X, Check } from 'lucide-react';
import styles from './ReviewSection.module.css';

type Review = {
  id: string;
  content: string;
  createdAt: Date;
  user: { id: string; name: string | null; displayName: string | null };
};

export default function ReviewSection({
  gameId,
  reviews,
  sessionUserId,
}: {
  gameId: number;
  reviews: Review[];
  sessionUserId: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [newContent, setNewContent] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const hasMyReview = reviews.some(r => r.user.id === sessionUserId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      const res = await createReviewAction(gameId, newContent);
      if (res.error) setError(res.error);
      else setNewContent('');
    });
  };

  const handleDelete = (reviewId: string) => {
    startTransition(async () => {
      await deleteReviewAction(reviewId, gameId);
    });
  };

  const handleUpdate = (reviewId: string) => {
    setError('');
    startTransition(async () => {
      const res = await updateReviewAction(reviewId, gameId, editContent);
      if (res.error) setError(res.error);
      else setEditingId(null);
    });
  };

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>Community Reviews <span className={styles.count}>({reviews.length})</span></h2>

      {/* Write/Edit Form */}
      {sessionUserId && !hasMyReview && (
        <form onSubmit={handleSubmit} className={styles.writeForm}>
          <textarea
            className={styles.textarea}
            placeholder="Share your thoughts on this game... (min. 15 characters)"
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            rows={4}
            disabled={isPending}
            required
          />
          {error && <p className={styles.errorMsg}>{error}</p>}
          <div className={styles.formActions}>
            <span className={styles.charCount}>{newContent.length} chars {newContent.length < 15 && '(need ' + (15 - newContent.length) + ' more)'}</span>
            <button type="submit" className={styles.submitBtn} disabled={isPending || newContent.trim().length < 15}>
              Post Review
            </button>
          </div>
        </form>
      )}

      {!sessionUserId && (
        <p className={styles.loginHint}>
          <a href="/api/auth/signin">Sign in</a> to write a review.
        </p>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className={styles.emptyState}>No reviews yet — be the first!</div>
      ) : (
        <div className={styles.reviewList}>
          {reviews.map(review => {
            const isOwner = review.user.id === sessionUserId;
            const isEditing = editingId === review.id;
            const displayName = review.user.displayName || review.user.name || 'Anonymous';

            return (
              <div key={review.id} className={styles.reviewCard}>
                <div className={styles.reviewHeader}>
                  <div className={styles.authorBlock}>
                    <div className={styles.avatar}>{displayName.charAt(0).toUpperCase()}</div>
                    <div>
                      <span className={styles.authorName}>{displayName}</span>
                      <span className={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {isOwner && (
                    <div className={styles.ownerActions}>
                      {isEditing ? (
                        <>
                          <button onClick={() => handleUpdate(review.id)} className={styles.iconBtnGreen} disabled={isPending} title="Save"><Check size={16}/></button>
                          <button onClick={() => setEditingId(null)} className={styles.iconBtn} title="Cancel"><X size={16}/></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingId(review.id); setEditContent(review.content); }} className={styles.iconBtn} title="Edit"><Pencil size={16}/></button>
                          <button onClick={() => handleDelete(review.id)} className={styles.iconBtnRed} disabled={isPending} title="Delete"><Trash2 size={16}/></button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {isEditing ? (
                  <textarea
                    className={styles.textarea}
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={4}
                    disabled={isPending}
                  />
                ) : (
                  <p className={styles.reviewContent}>{review.content}</p>
                )}
                {error && isEditing && <p className={styles.errorMsg}>{error}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
