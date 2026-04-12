import {AnimatePresence, motion} from 'framer-motion';
import {Check, ChevronLeft, ChevronRight, Copy, LoaderCircle} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';
import type {FormEvent, ReactNode} from 'react';

import {
  usePointerParallax,
  useSectionParallax,
} from '@/src/components/shared/CinematicParallax';
import {RevealOnScroll} from '@/src/components/shared/RevealOnScroll';
import {createQrValue, getQrPreviewUrl} from '@/src/lib/guest';
import {cn} from '@/src/lib/utils';
import type {InvitationConfig} from '@/src/types/invitation';
import type {AttendanceStatus, RsvpPayload, RsvpRecord} from '@/src/types/rsvp';

type RsvpSectionProps = {
  invitation: InvitationConfig;
  initialGuestName: string;
  maxGuestsOverride?: number | null;
};

const COMMENTS_PER_PAGE = 5;

export function RsvpSection({
  invitation,
  initialGuestName,
  maxGuestsOverride,
}: RsvpSectionProps) {
  const sectionParallax = useSectionParallax<HTMLElement>({y: [-36, 42]});
  const imagePointer = usePointerParallax({strength: 16, rotate: 4});
  const [guestName, setGuestName] = useState(initialGuestName);
  const [attendance, setAttendance] = useState<AttendanceStatus>('attending');
  const [guestCount, setGuestCount] = useState(1);
  const [wishes, setWishes] = useState('');
  const [records, setRecords] = useState<RsvpRecord[]>([]);
  const [page, setPage] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const maxGuests = maxGuestsOverride ?? invitation.rsvp.maxGuestsDefault;
  const qrValue = createQrValue(invitation.slug, guestName);
  const qrPreview = getQrPreviewUrl(qrValue);
  const introY = sectionParallax.y;

  const visibleRecords = useMemo(() => {
    const start = page * COMMENTS_PER_PAGE;
    return records.slice(start, start + COMMENTS_PER_PAGE);
  }, [page, records]);

  const totalPages = Math.max(1, Math.ceil(records.length / COMMENTS_PER_PAGE));

  useEffect(() => {
    setGuestName(initialGuestName);
  }, [initialGuestName]);

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
          setLoadError('Unable to load wishes right now. You can still send your RSVP.');
        }
      });

    return () => {
      active = false;
    };
  }, [invitation.slug]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages - 1));
  }, [totalPages]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    const payload: RsvpPayload = {
      invitationSlug: invitation.slug,
      guestName: guestName.trim(),
      attendance,
      guestCount: attendance === 'attending' ? guestCount : 0,
      wishes: wishes.trim(),
    };

    try {
      const response = await fetch('/api/rsvps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Unable to save RSVP.');
      }

      const next = (await response.json()) as {record: RsvpRecord};
      setRecords((current) => [next.record, ...current]);
      setPage(0);
      setSubmitMessage('Your RSVP has been recorded. Thank you for celebrating with us.');
      setWishes('');
      setAttendance('attending');
      setGuestCount(1);
    } catch {
      setSubmitMessage('We could not submit your RSVP. Please try again in a moment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section ref={sectionParallax.ref} id="rsvp" className="border-t border-white/6 bg-[#000000] px-5 py-24 text-white md:px-10">
      <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-2 lg:gap-8">
        <RevealOnScroll className="self-start">
          <motion.img
            {...imagePointer.bind}
            style={{...sectionParallax.style, ...imagePointer.style}}
            src={invitation.media.rsvpImage}
            alt={`${invitation.couple.joinedName} portrait`}
            className="w-full scale-[0.7] object-contain object-top"
            referrerPolicy="no-referrer"
          />
        </RevealOnScroll>

        <div className="space-y-8">
          <RevealOnScroll>
            <motion.h2 style={{y: introY}} className="text-xl leading-relaxed text-white/82 md:text-3xl">
              We kindly request your prompt response to confirm your attendance at our upcoming event. Alongside your RSVP, please take a moment to extend your warm regards and best wishes.
            </motion.h2>
          </RevealOnScroll>

          <RevealOnScroll className="p-6 md:p-8">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <Field label="Name">
                  <input
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                    className="invitation-input"
                    placeholder="Guest Name"
                    required
                  />
                </Field>

                <div className="bg-[#f4efe8] p-5 text-[#111]">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-black/45">
                    {invitation.couple.coverLabel}
                  </p>
                  <h3 className="mt-3 font-display text-3xl italic md:text-4xl">
                    {invitation.couple.joinedName}
                  </h3>
                  <div className="mt-6 flex flex-col items-center gap-5 text-center">
                    <img src={qrPreview} alt="QR preview" className="h-40 w-40 border border-black/10 bg-white p-2" />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.35em] text-black/45">Dear</p>
                      <p className="mt-2 font-display text-3xl italic">{guestName || 'Guest Name'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(qrValue);
                          setCopiedId(qrValue);
                          window.setTimeout(() => setCopiedId(null), 2000);
                        } catch {
                          setSubmitMessage('Copy is unavailable on this device/browser.');
                        }
                      }}
                      className="inline-flex items-center gap-2 border border-black/10 px-4 py-2 text-[10px] uppercase tracking-[0.32em] text-black/65 transition hover:border-black/20 hover:text-black"
                    >
                      {copiedId === qrValue ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      Copy check-in code
                    </button>
                    <p className="max-w-sm text-sm leading-relaxed text-black/60">
                      Scan this QR code at the event for check-in. If it does not appear, please state your name upon arrival.
                    </p>
                  </div>
                </div>

                <Field label="Attendance">
                  <div role="radiogroup" aria-label="Attendance" className="grid gap-3 sm:grid-cols-2">
                    {[
                      {label: 'Excited to Attend', value: 'attending' as const},
                      {label: 'Unable to Attend', value: 'unable' as const},
                    ].map((option) => {
                      const active = attendance === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          aria-pressed={active}
                          onClick={() => setAttendance(option.value)}
                          className={cn(
                            'rounded-[1.25rem] border px-4 py-3 text-left text-sm transition',
                            active
                              ? 'border-white bg-white text-black'
                              : 'border-white/12 bg-white/[0.03] text-white/75 hover:border-white/20 hover:text-white',
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <AnimatePresence initial={false}>
                  {attendance === 'attending' && (
                    <motion.div
                      initial={{opacity: 0, height: 0}}
                      animate={{opacity: 1, height: 'auto'}}
                      exit={{opacity: 0, height: 0}}
                      className="overflow-hidden"
                    >
                      <Field label={`No of Guest (Max ${maxGuests})`}>
                        <input
                          type="number"
                          min={1}
                          max={maxGuests}
                          value={guestCount}
                          onChange={(event) =>
                            setGuestCount(
                              Math.max(1, Math.min(maxGuests, Number(event.target.value))),
                            )
                          }
                          className="invitation-input"
                        />
                      </Field>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Field label="Wishes">
                  <textarea
                    value={wishes}
                    onChange={(event) => setWishes(event.target.value)}
                    className="invitation-input min-h-32 resize-y"
                    placeholder="Share a note for the couple"
                    rows={4}
                  />
                </Field>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-3 bg-white px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.34em] text-black transition hover:bg-[#e7d9ca] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  Submit RSVP
                </button>

                {submitMessage ? (
                  <p className="text-sm leading-relaxed text-white/65">{submitMessage}</p>
                ) : null}
              </form>
            </RevealOnScroll>
        </div>
      </div>

      <RevealOnScroll className="mx-auto mt-16 max-w-[1440px]">
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4 pb-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-white/45">Wishes</p>
              <h3 className="mt-3 font-display text-4xl italic text-white md:text-5xl">Messages for the Couple</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-[10px] uppercase tracking-[0.32em] text-white/45 sm:block">
                Page {page + 1} of {totalPages}
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {loadError ? (
              <p className="text-sm text-white/60">
                {loadError}
              </p>
            ) : null}

            {!loadError && visibleRecords.length === 0 ? (
              <p className="text-sm text-white/60">
                No wishes yet. Be the first guest to leave a message.
              </p>
            ) : null}

            {visibleRecords.map((record) => (
              <article
                key={record.id}
                className="space-y-3 pb-6 border-b border-white/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <strong className="font-copy text-base font-medium text-white">{record.guestName}</strong>
                  <small className="shrink-0 text-[10px] uppercase tracking-[0.24em] text-white/40">
                    {new Date(record.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </small>
                </div>
                <p className="text-sm leading-relaxed text-white/70">
                  {record.wishes || 'Will celebrate with joy and gratitude.'}
                </p>
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
                className="border border-white/12 p-3 text-white/55 transition hover:border-white/24 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Previous comments page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                className="border border-white/12 p-3 text-white/55 transition hover:border-white/24 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Next comments page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}

function Field({label, children}: {label: string; children: ReactNode}) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] uppercase tracking-[0.32em] text-white/45">{label}</span>
      {children}
    </label>
  );
}