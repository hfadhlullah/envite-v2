import {ChevronLeft, ChevronRight} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';

import {useSectionParallax} from '@/src/components/shared/CinematicParallax';
import {RevealOnScroll} from '@/src/components/shared/RevealOnScroll';
import type {InvitationConfig} from '@/src/types/invitation';
import type {RsvpRecord} from '@/src/types/rsvp';

type WishesSectionProps = {
  invitation: InvitationConfig;
};

const COMMENTS_PER_PAGE = 5;

export function WishesSection({invitation}: WishesSectionProps) {
  const sectionParallax = useSectionParallax<HTMLElement>({y: [-36, 42]});
  const [records, setRecords] = useState<RsvpRecord[]>([]);
  const [page, setPage] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const visibleRecords = useMemo(() => {
    const start = page * COMMENTS_PER_PAGE;
    return records.slice(start, start + COMMENTS_PER_PAGE);
  }, [page, records]);

  const totalPages = Math.max(1, Math.ceil(records.length / COMMENTS_PER_PAGE));

  useEffect(() => {
    let active = true;

    fetch(`/api/rsvps?slug=${encodeURIComponent(invitation.slug)}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Unable to load existing wishes.');
        }

        return response.json() as Promise<{items?: RsvpRecord[]}>;
      })
      .then((payload: {items: RsvpRecord[]}) => {
        if (active) {
          setRecords(Array.isArray(payload.items) ? payload.items : []);
          setLoadError(null);
        }
      })
      .catch(() => {
        if (active) {
          setRecords([]);
          setLoadError('Unable to load wishes right now.');
        }
      });

    return () => {
      active = false;
    };
  }, [invitation.slug]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages - 1));
  }, [totalPages]);

  return (
    <section ref={sectionParallax.ref} className="border-t border-white/6 bg-[#050505] px-5 py-24 text-white md:px-10">
      <div className="mx-auto max-w-[1440px]">
        <RevealOnScroll className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <div className="flex items-end justify-between gap-6 border-b border-white/10 pb-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-white/45">Wishes</p>
              <h3 className="mt-3 font-display text-4xl italic md:text-5xl">Messages for the Couple</h3>
            </div>
            <div className="hidden text-[10px] uppercase tracking-[0.32em] text-white/45 sm:block">
              Page {page + 1} of {totalPages}
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {loadError ? (
              <p className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60">
                {loadError}
              </p>
            ) : null}
            {visibleRecords.map((record) => (
              <article
                key={record.id}
                className="grid gap-3 border-b border-white/8 pb-5 last:border-b-0 lg:grid-cols-[180px_1fr_auto] lg:items-start"
              >
                <strong className="font-copy text-base font-medium text-[#d4c2b1]">
                  {record.guestName}
                </strong>
                <p className="text-sm leading-relaxed text-white/75">
                  {record.wishes || 'Will celebrate with joy and gratitude.'}
                </p>
                <small className="text-[10px] uppercase tracking-[0.25em] text-white/35">
                  {new Date(record.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </small>
              </article>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
            <span className="text-[10px] uppercase tracking-[0.32em] text-white/45 sm:hidden">
              Page {page + 1} / {totalPages}
            </span>
            <div className="ml-auto flex gap-3">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                className="rounded-full border border-white/10 p-3 text-white/60 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Previous comments page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                className="rounded-full border border-white/10 p-3 text-white/60 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Next comments page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}