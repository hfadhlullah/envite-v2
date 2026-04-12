import React, {useEffect, useMemo, useRef, useState} from 'react';
import {AnimatePresence, motion, useMotionValue, useReducedMotion, useScroll, useTransform} from 'framer-motion';
import {
  ArrowRight,
  CalendarPlus,
  Check,
  Copy,
  ExternalLink,
  Globe,
  Instagram,
  Menu,
  MessageCircle,
  Music2,
  PauseCircle,
  PlayCircle,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';

import {RsvpSection} from '@/src/components/invitation/RsvpSection';
import {TwoAreBetterThanOneSection} from '@/src/components/invitation/TwoAreBetterThanOneSection';
import {
  usePointerParallax,
  useSectionParallax,
} from '@/src/components/shared/CinematicParallax';
import {Countdown} from '@/src/components/shared/Countdown';
import {Marquee} from '@/src/components/shared/Marquee';
import {Modal} from '@/src/components/shared/Modal';
import {ParallaxImage} from '@/src/components/shared/ParallaxImage';
import {RevealOnScroll} from '@/src/components/shared/RevealOnScroll';
import {buildCalendarDataUrl} from '@/src/lib/calendar';
import {createQrValue, getGuestNameFromSearch} from '@/src/lib/guest';
import {cn} from '@/src/lib/utils';
import type {GiftAccount, InvitationConfig} from '@/src/types/invitation';

const NAV_ITEMS = [
  {id: 'home', label: 'Home'},
  {id: 'profile', label: 'Profile'},
  {id: 'lovestory', label: 'Love Story'},
  {id: 'weddingevent', label: 'Wedding Event'},
  {id: 'rsvp', label: 'RSVP'},
  {id: 'weddinggift', label: 'Wedding Gift'},
  {id: 'gallery', label: 'Gallery'},
];

type InvitationPageProps = {
  invitation: InvitationConfig;
};

export function InvitationPage({invitation}: InvitationPageProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const [stage, setStage] = useState<'loading' | 'cover' | 'open'>('loading');
  const [loaderProgress, setLoaderProgress] = useState(0);
  const [navOpen, setNavOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [storyIndex, setStoryIndex] = useState(0);
  const [guestName, setGuestName] = useState('Guest Name');
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  const {scrollYProgress} = useScroll();
  const heroSection = useSectionParallax<HTMLElement>({
    y: [-90, 120],
    scale: [1.16, 1.04],
  });
  const storyIntroSection = useSectionParallax<HTMLElement>({
    y: [-90, 90],
    scale: [1.12, 1.02],
  });
  const timelineSection = useSectionParallax<HTMLElement>({y: [-36, 36]});
  const countdownSection = useSectionParallax<HTMLElement>({y: [-56, 56]});
  const eventsSection = useSectionParallax<HTMLElement>({y: [-48, 48]});
  const giftSection = useSectionParallax<HTMLElement>({y: [-48, 56]});
  const heroPointer = usePointerParallax({strength: 24, rotate: 6});

  const heroOverlay = useTransform(
    heroSection.progress,
    [0, 0.18, 1],
    shouldReduceMotion ? [0.52, 0.52, 0.52] : [0.14, 0.52, 0.84],
  );
  const heroContentY = useTransform(heroSection.progress, [0, 1], shouldReduceMotion ? [0, 0] : [-12, 58]);
  const heroOpacity = useTransform(
    heroSection.progress,
    [0, 0.24, 0.95],
    shouldReduceMotion ? [1, 1, 1] : [1, 0.82, 0.2],
  );
  const heroFadeOut = useTransform(heroSection.progress, [0.3, 1], [1, 0]);
  const heroMarqueeNear = useTransform(heroSection.progress, [0, 1], shouldReduceMotion ? [0, 0] : [-10, 62]);
  const heroScriptureY = useTransform(heroSection.progress, [0, 1], shouldReduceMotion ? [0, 0] : [0, 34]);
  const storyTitleY = useTransform(storyIntroSection.progress, [0, 1], shouldReduceMotion ? [0, 0] : [-20, 52]);
  const storyBackdropY = useTransform(storyIntroSection.progress, [0, 1], shouldReduceMotion ? [0, 0] : [-100, 110]);
  const countdownMarqueeY = useTransform(countdownSection.progress, [0, 1], shouldReduceMotion ? [0, 0] : [-24, 28]);
  const countdownTextY = useTransform(countdownSection.progress, [0, 1], shouldReduceMotion ? [0, 0] : [-20, 36]);
  const eventsHeadingY = useTransform(eventsSection.progress, [0, 1], shouldReduceMotion ? [0, 0] : [-20, 44]);
  const giftTextY = useTransform(giftSection.progress, [0, 1], shouldReduceMotion ? [0, 0] : [-18, 34]);

  useEffect(() => {
    setGuestName(getGuestNameFromSearch(window.location.search, invitation.guestQueryParam));
  }, [invitation.guestQueryParam]);

  useEffect(() => {
    if (stage !== 'loading') return;

    const LOADER_DURATION_MS = 3000;
    const start = performance.now();

    const interval = window.setInterval(() => {
      const elapsed = performance.now() - start;
      const nextProgress = Math.min(100, (elapsed / LOADER_DURATION_MS) * 100);
      setLoaderProgress(nextProgress);

      if (elapsed >= LOADER_DURATION_MS) {
        window.clearInterval(interval);
        setLoaderProgress(100);
        setStage('cover');
      }
    }, 30);

    return () => window.clearInterval(interval);
  }, [stage]);

  const currentStoryImage = invitation.media.storyImages[storyIndex] ?? invitation.media.heroPoster;

  useEffect(() => {
    if (invitation.media.storyImages.length <= 1) return;

    const timer = window.setInterval(() => {
      setStoryIndex((current) => (current + 1) % invitation.media.storyImages.length);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [invitation.media.storyImages.length]);

  useEffect(() => {
    if (stage !== 'open' || !audioRef.current) return;

    if (videoOpen) {
      audioRef.current.pause();
      return;
    }

    if (isAudioEnabled) {
      audioRef.current.play().catch(() => undefined);
    } else {
      audioRef.current.pause();
    }
  }, [isAudioEnabled, stage, videoOpen]);

  useEffect(() => {
    document.title = invitation.seo.title;
    const description = document.querySelector('meta[name="description"]');

    if (description) {
      description.setAttribute('content', invitation.seo.description);
    }
  }, [invitation.seo.description, invitation.seo.title]);

  const calendarUrl = useMemo(
    () => buildCalendarDataUrl(invitation.countdown.calendar),
    [invitation.countdown.calendar],
  );

  const qrValue = createQrValue(invitation.slug, guestName);

  const openInvitation = () => {
    setStage('open');
    if (audioRef.current && isAudioEnabled) {
      audioRef.current.play().catch(() => undefined);
    }
  };

  const toggleAudio = () => {
    setIsAudioEnabled((current) => !current);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <audio ref={audioRef} src={invitation.media.audio} loop preload="none" />

      <AnimatePresence mode="wait">
        {stage === 'loading' ? (
          <FakeLoader invitation={invitation} progress={loaderProgress} />
        ) : stage === 'cover' ? (
          <CoverScreen
            invitation={invitation}
            guestName={guestName}
            onOpen={openInvitation}
          />
        ) : (
            <motion.main
              key="invitation"
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              className="relative overflow-x-hidden"
            >
            <motion.div
              style={{scaleX: scrollYProgress}}
              className="fixed left-0 right-0 top-0 z-[90] h-px origin-left bg-[#d8b181]"
            />

            <FloatingUi
              navOpen={navOpen}
            onOpenNav={() => setNavOpen((current) => !current)}
              onToggleAudio={toggleAudio}
              audioEnabled={isAudioEnabled}
            />

            <motion.section ref={heroSection.ref} id="home" style={{opacity: heroFadeOut}} className="relative min-h-screen overflow-hidden">
              <motion.div
                {...heroPointer.bind}
                style={{...heroSection.style, ...heroPointer.style}}
                className="absolute inset-0"
              >
                <video
                  className="absolute inset-0 h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster={invitation.media.heroPoster}
                  src={invitation.media.heroVideo}
                />
              </motion.div>
              <motion.div
                style={{opacity: heroOverlay}}
                className="absolute inset-0 bg-black"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(255,255,255,0.08),transparent_42%),linear-gradient(to_bottom,rgba(0,0,0,0.26),rgba(0,0,0,0.88))]" />

              <div className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-8 md:px-10 md:py-7">
          <span className="text-[14px] md:text-[25px] text-[#FFFFFF]">{invitation.couple.coverLabel}</span>
          <span className="text-[14px] md:text-[25px] text-[#FFFFFF]">{invitation.couple.dateLabel}</span>
        </div>
              </div>

              <motion.div style={{y: heroMarqueeNear, opacity: heroOpacity}} className="absolute inset-x-0 top-[13vh] z-20 px-4 md:px-0">
                <Marquee text={invitation.couple.joinedName} className="hero-marquee text-white/60" />
              </motion.div>

              <motion.div
                style={{y: heroContentY, opacity: heroOpacity}}
                className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1440px] px-5 pt-[35vh] md:px-10 md:pt-[34vh]"
              >
                <RevealOnScroll className="max-w-[25rem] md:max-w-[31rem]">
                  <motion.p style={{y: heroScriptureY}} className="font-copy text-sm leading-relaxed text-[#FFFFFF] md:text-[1.5rem] md:leading-[1.45]">
                    &ldquo;{invitation.couple.scripture.text}&rdquo;
                  </motion.p>
                  <p className="mt-4 text-[12px] uppercase tracking-[0.01em] text-white/42 md:mt-5">
                    {invitation.couple.scripture.citation}
                  </p>
                </RevealOnScroll>
              </motion.div>
            </motion.section>

            <TwoAreBetterThanOneSection invitation={invitation} />

            <section id="profile" className="bg-[#000000] px-5 py-10 pb-24 md:px-10 md:pb-[600px]">
              <div className="mx-auto max-w-[1440px] space-y-[400px] md:space-y-[600px]">
                <ProfileCard person={invitation.couple.bride} align="left" accent={invitation.theme.accent} />
                <ProfileCard person={invitation.couple.groom} align="right" accent={invitation.theme.accent} />
              </div>
            </section>

            <section ref={storyIntroSection.ref} id="lovestory" className="relative md:min-h-screen overflow-hidden bg-[#000000]">
              {/* Mobile: Landscape image with title overlay */}
              <div className="relative h-[56.25vw] w-full md:hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStoryImage}
                    initial={{opacity: 0.35, scale: 1.04}}
                    animate={{opacity: 1, scale: 1}}
                    exit={{opacity: 0.35, scale: 1.02}}
                    style={{y: storyBackdropY}}
                    transition={{duration: 1.4, ease: [0.22, 1, 0.36, 1]}}
                    className="absolute inset-0"
                  >
                    <img
                      src={currentStoryImage}
                      alt="Love story backdrop"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/55" />
                  </motion.div>
                </AnimatePresence>

                <div className="absolute inset-0 z-10 flex items-center justify-center px-5">
                  <RevealOnScroll className="text-center">
                    <motion.h2 style={{y: storyTitleY}} className="font-display text-4xl italic leading-none text-white">
                      {invitation.story.title}
                    </motion.h2>
                  </RevealOnScroll>
                </div>
              </div>

              {/* Desktop: Full screen with image */}
              <div className="hidden md:block md:h-full md:min-h-screen">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStoryImage}
                    initial={{opacity: 0.35, scale: 1.04}}
                    animate={{opacity: 1, scale: 1}}
                    exit={{opacity: 0.35, scale: 1.02}}
                    style={{y: storyBackdropY}}
                    transition={{duration: 1.4, ease: [0.22, 1, 0.36, 1]}}
                    className="absolute inset-0"
                  >
                    <img
                      src={currentStoryImage}
                      alt="Love story backdrop"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/55" />
                  </motion.div>
                </AnimatePresence>

                <div className="relative z-10 flex min-h-screen items-center justify-center px-10">
                  <RevealOnScroll className="text-center">
                    <motion.h2 style={{y: storyTitleY}} className="font-display text-8xl italic leading-none text-white">
                      {invitation.story.title}
                    </motion.h2>
                  </RevealOnScroll>
                </div>
              </div>
            </section>

            <section ref={timelineSection.ref} className="bg-[#000000] px-5 py-24 md:px-10">
              <motion.div style={{y: timelineSection.y}} className="mx-auto max-w-[1320px] space-y-16">
                {invitation.story.timeline.map((entry, index) => (
                  <div key={entry.year}>
                    <TimelineEntryRow entry={entry} index={index} />
                  </div>
                ))}
              </motion.div>
            </section>

            <section ref={countdownSection.ref} id="weddingevent" className="bg-[#000000] px-5 py-24 md:px-10">
              <div className="mx-auto max-w-[1440px] space-y-10">
                <motion.div style={{y: countdownMarqueeY}}>
                  <Marquee text={invitation.countdown.label} muted className="text-white/25" />
                </motion.div>

                <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr]">
                  <RevealOnScroll>
                    <ParallaxImage
                      src={invitation.countdown.image}
                      alt="Countdown scene"
                      className="min-h-[480px]"
                      overlayOpacity={0.18}
                      targetRef={countdownSection.ref}
                      enablePointer
                      mouseStrength={16}
                    />
                  </RevealOnScroll>

                  <RevealOnScroll delay={0.08} className="bg-white/[0.03] p-8 md:p-12">
                    <motion.p style={{y: countdownTextY}} className="text-[10px] uppercase tracking-[0.35em] text-white/45">Countdown</motion.p>
                    <motion.div style={{y: countdownTextY}} className="mt-8">
                      <Countdown target={invitation.countdown.target} />
                    </motion.div>
                    <a
                      href={calendarUrl}
                      className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/12 px-6 py-3 text-[10px] uppercase tracking-[0.32em] text-white/75 transition hover:border-white/24 hover:bg-white hover:text-black"
                    >
                      <CalendarPlus className="h-4 w-4" />
                      Add to Calendar
                    </a>
                  </RevealOnScroll>
                </div>
              </div>
            </section>

            <section ref={eventsSection.ref} className="border-t border-black/6 bg-[#ece6de] px-5 py-24 text-[#111] md:px-10">
              <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.44fr_0.56fr]">
                <RevealOnScroll>
                  <motion.p style={{y: eventsHeadingY}} className="text-[10px] uppercase tracking-[0.4em] text-black/45">{invitation.events.title}</motion.p>
                </RevealOnScroll>

                <div className="space-y-14">
                  <RevealOnScroll>
                    <motion.h2 style={{y: eventsHeadingY}} className="whitespace-pre-line font-display text-6xl italic leading-[0.92] md:text-8xl">
                      {invitation.events.dateLabel}
                    </motion.h2>
                  </RevealOnScroll>

                  <div className="space-y-7">
                    {invitation.events.details.map((detail, index) => (
                      <div key={detail.title}>
                        <EventDetailRow detail={detail} index={index} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section ref={giftSection.ref} id="weddinggift" className="bg-[#ece6de] px-5 py-24 text-[#111] md:px-10">
              <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[0.98fr_1.02fr]">
                {/* Image first on mobile */}
                <RevealOnScroll delay={0.1} className="md:order-2">
                  <img
                    src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80"
                    alt="Gift section"
                    className="w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </RevealOnScroll>

                {/* Text and button second on mobile */}
                <RevealOnScroll className="md:order-1">
                  <motion.p style={{y: giftTextY}} className="max-w-3xl text-3xl leading-tight text-black md:text-5xl">
                    {invitation.gift.intro}
                  </motion.p>
                  <button
                    type="button"
                    onClick={() => setGiftOpen(true)}
                    className="mt-10 inline-flex items-center gap-3 rounded-full bg-black px-6 py-3 text-[10px] uppercase tracking-[0.35em] text-white transition hover:bg-[#2a211a]"
                  >
                    View Gift Details
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </RevealOnScroll>
              </div>
            </section>

            <RsvpSection invitation={invitation} initialGuestName={guestName} />

            <VideoSection
              invitation={invitation}
              onOpenVideo={() => setVideoOpen(true)}
            />

            <GallerySection
              invitation={invitation}
              onOpenImage={(image) => setLightboxImage(image)}
            />

            <ThankYouSection invitation={invitation} />

            <Modal open={navOpen} onClose={() => setNavOpen(false)} title="Navigate">
              <div className="grid gap-6 p-6 md:grid-cols-2 md:p-10">
                <div className="space-y-3">
                  {NAV_ITEMS.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={() => setNavOpen(false)}
                      className="flex items-center justify-between rounded-[1.5rem] border border-white/8 px-5 py-4 text-xl text-white/75 transition hover:border-white/16 hover:bg-white/[0.04] hover:text-white"
                    >
                      {item.label}
                      <ArrowRight className="h-5 w-5" />
                    </a>
                  ))}
                </div>
                <div className="rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-6">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-white/45">Quick note</p>
                  <p className="mt-5 max-w-md text-lg leading-relaxed text-white/76">
                    Please click one of the menu options above to navigate directly to your desired section.
                  </p>
                  <div className="mt-10 rounded-[1.5rem] border border-white/8 bg-black/30 p-5">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-white/45">Check-in code</p>
                    <p className="mt-4 font-display text-4xl italic text-white">{qrValue}</p>
                  </div>
                </div>
              </div>
            </Modal>

            <Modal open={giftOpen} onClose={() => setGiftOpen(false)} title="Bank Account">
              <div className="grid gap-4 p-6 md:grid-cols-3 md:p-10">
                {invitation.gift.accounts.map((account) => (
                  <div key={account.id}>
                    <GiftCard
                      account={account}
                      copiedAccount={copiedAccount}
                      onCopy={async () => {
                        try {
                          await navigator.clipboard.writeText(account.number);
                          setCopiedAccount(account.number);
                          window.setTimeout(() => setCopiedAccount(null), 1800);
                        } catch {
                          setCopiedAccount(null);
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            </Modal>

            <Modal
              open={videoOpen}
              onClose={() => setVideoOpen(false)}
              title="Play Film"
              className="max-w-6xl"
            >
              <div className="aspect-video bg-black">
                <iframe
                  src={invitation.media.videoUrl}
                  title={`${invitation.couple.joinedName} wedding film`}
                  className="h-full w-full"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </Modal>

            <Modal
              open={Boolean(lightboxImage)}
              onClose={() => setLightboxImage(null)}
              title="Gallery Preview"
              className="max-w-[90vw]"
            >
              {lightboxImage ? (
                <img
                  src={lightboxImage}
                  alt="Gallery preview"
                  className="max-h-[86vh] w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : null}
            </Modal>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}

function CoverScreen({
  invitation,
  guestName,
  onOpen,
}: {
  invitation: InvitationConfig;
  guestName: string;
  onOpen: () => void;
}) {
  const coverParallax = useSectionParallax<HTMLElement>({
    y: [-40, 60],
    scale: [1.08, 1.02],
  });
  const coverPointer = usePointerParallax({strength: 18, rotate: 5});

  return (
    <motion.section
      ref={coverParallax.ref}
      key="cover"
      initial={{opacity: 1}}
      exit={{opacity: 0, scale: 1.03}}
      transition={{duration: 0.8, ease: [0.22, 1, 0.36, 1]}}
      className="fixed inset-0 z-[110] overflow-hidden"
    >
      <motion.div
        {...coverPointer.bind}
        style={{...coverParallax.style, ...coverPointer.style}}
        className="absolute inset-0"
      >
        <img
          src={invitation.media.coverImage}
          alt="Invitation cover"
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_35%),linear-gradient(to_bottom,rgba(0,0,0,0.2),rgba(0,0,0,0.84))]" />
      </motion.div>

      <div className="relative z-10 flex min-h-screen flex-col justify-between px-6 py-8 text-white md:px-10 md:py-10">
        <div className="flex items-center justify-between text-[12px] uppercase tracking-[0.02em] text-white/52">
          <span>{invitation.couple.coverLabel}</span>
          <span>{invitation.couple.dateLabel}</span>
        </div>

        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center text-center">
          <RevealOnScroll>
            <h1 className="font-display text-[17vw] italic leading-[0.88] tracking-[-0.06em] text-white md:text-[10rem] lg:text-[12rem]">
              {invitation.couple.joinedName}
            </h1>
          </RevealOnScroll>
          <RevealOnScroll delay={0.08} className="mt-8 max-w-xl rounded-[1.75rem] border border-white/12 bg-black/20 px-6 py-5 backdrop-blur-md">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/55">Dear</p>
            <p className="mt-3 font-display text-4xl italic md:text-5xl">{guestName}</p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.16}>
            <button
              type="button"
              onClick={onOpen}
              className="mt-10 inline-flex items-center gap-3 rounded-full border border-white/16 bg-black/22 px-7 py-3 text-[10px] uppercase tracking-[0.34em] text-white transition hover:bg-white hover:text-black"
            >
              <PlayCircle className="h-4 w-4" />
              Let&apos;s Open
            </button>
          </RevealOnScroll>
        </div>

        <p className="text-[10px] uppercase tracking-[0.3em] text-white/38">
          Loading the invitation experience.
        </p>
      </div>
    </motion.section>
  );
}

function FakeLoader({
  invitation,
  progress,
}: {
  invitation: InvitationConfig;
  progress: number;
}) {
  const loaderParallax = useSectionParallax<HTMLElement>({
    y: [-30, 30],
    scale: [1.04, 1.01],
  });
  const loaderImageY = useTransform(loaderParallax.progress, [0, 1], loaderParallax.shouldReduceMotion ? [0, 0] : [-18, 20]);
  const loaderTextY = useTransform(loaderParallax.progress, [0, 1], loaderParallax.shouldReduceMotion ? [0, 0] : [14, -12]);

  return (
    <motion.section
      ref={loaderParallax.ref}
      key="loader"
      initial={{opacity: 1}}
      exit={{opacity: 0, scale: 1.02}}
      transition={{duration: 0.55, ease: [0.22, 1, 0.36, 1]}}
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-[#f2eee8] text-[#111]"
    >
      <motion.div style={loaderParallax.style} className="flex items-center gap-8 md:gap-16">
        <motion.span style={{y: loaderTextY}} className="text-[10px] uppercase tracking-[0.3em] text-black/55">
          {invitation.couple.coverLabel}
        </motion.span>
        <motion.div style={{y: loaderImageY}} className="h-16 w-16 overflow-hidden rounded-sm md:h-20 md:w-20">
          <img
            src={invitation.media.coverImage}
            alt="Loader preview"
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>
        <motion.span style={{y: loaderTextY}} className="text-[10px] uppercase tracking-[0.3em] text-black/55">
          {invitation.couple.joinedName}
        </motion.span>
      </motion.div>

      <div className="absolute bottom-10 left-6 right-6 flex items-end justify-between gap-6 md:left-10 md:right-10">
        <div className="w-full max-w-xs overflow-hidden rounded-full bg-black/8">
          <motion.div
            animate={{width: `${Math.min(progress, 100)}%`}}
            transition={{duration: 0.3, ease: 'easeOut'}}
            className="h-[2px] bg-black/70"
          />
        </div>
        <p className="shrink-0 text-[10px] uppercase tracking-[0.24em] text-black/45">
          Loading... {Math.round(Math.min(progress, 100))}%
        </p>
      </div>
    </motion.section>
  );
}

function FloatingUi({
  navOpen,
  onOpenNav,
  onToggleAudio,
  audioEnabled,
}: {
  navOpen: boolean;
  onOpenNav: () => void;
  onToggleAudio: () => void;
  audioEnabled: boolean;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onOpenNav}
        className="fixed right-5 top-5 z-[95] flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white backdrop-blur-md transition hover:border-white/22 hover:bg-white hover:text-black md:right-8 md:top-8"
        aria-expanded={navOpen}
        aria-label="Open navigation"
      >
        {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <button
        type="button"
        onClick={onToggleAudio}
        className="fixed bottom-5 left-5 z-[95] flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white backdrop-blur-md transition hover:border-white/22 hover:bg-white hover:text-black md:bottom-8 md:left-8"
        aria-label={audioEnabled ? 'Mute invitation audio' : 'Play invitation audio'}
      >
        {audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
      </button>
    </>
  );
}

function ProfileCard({
  person,
  align,
  accent,
}: {
  person: InvitationConfig['couple']['bride'];
  align: 'left' | 'right';
  accent: string;
}) {
  const isRight = align === 'right';
  const profileParallax = useSectionParallax<HTMLDivElement>({y: [-36, 48]});
  const imagePointer = usePointerParallax({strength: 18, rotate: 5});
  const textY = useTransform(profileParallax.progress, [0, 1], profileParallax.shouldReduceMotion ? [0, 0] : [-16, 26]);
  const imageY = useTransform(profileParallax.progress, [0, 1], profileParallax.shouldReduceMotion ? [0, 0] : [-52, 64]);

  return (
    <div ref={profileParallax.ref} className="grid gap-8 lg:grid-cols-[0.2fr_0.2fr_0.6fr] lg:items-center">
      {/* Title - First on mobile */}
      {isRight && (
        <RevealOnScroll className="lg:order-1">
          <div className="text-center lg:pt-20">
            <p className="text-xl uppercase tracking-[0.36em] text-white/45">{person.title}</p>
          </div>
        </RevealOnScroll>
      )}

      {!isRight && (
        <RevealOnScroll className="lg:order-1">
          <div className="text-center lg:pt-20">
            <p className="text-xl uppercase tracking-[0.36em] text-white/45">{person.title}</p>
          </div>
        </RevealOnScroll>
      )}

      {/* Image - Second on mobile */}
      <RevealOnScroll delay={0.1} className="lg:order-2 lg:col-start-2">
        <motion.div
          {...imagePointer.bind}
          style={{y: imageY, ...imagePointer.style}}
          className="relative flex justify-center"
        >
          <img
            src={person.image}
            alt={person.fullName}
            className="aspect-[4/5] w-full max-w-[280px] scale-[1.06] object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </RevealOnScroll>

      {/* Text (Name, Parents, Link) - Third on mobile */}
      {isRight && (
        <RevealOnScroll className="lg:order-3 lg:pt-20">
          <motion.div style={{y: textY}} className="space-y-5">
            <h3 className="font-display text-5xl italic leading-[0.94] text-white md:text-7xl">
              ({person.nickname})
              <br />
              {person.fullName}
            </h3>
            <div className="space-y-1 text-base leading-relaxed text-white/68 md:text-lg">
              {person.parents.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            {person.instagram ? (
              <a
                href={person.instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/55 transition hover:text-white"
              >
                Follow Story
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
          </motion.div>
        </RevealOnScroll>
      )}

      {!isRight && (
        <RevealOnScroll className="lg:order-3 lg:text-left lg:pt-20">
          <motion.div style={{y: textY}} className="space-y-5">
            <h3 className="font-display text-5xl italic leading-[0.94] text-white md:text-7xl">
              ({person.nickname})
              <br />
              {person.fullName}
            </h3>
            <div className="space-y-1 text-base leading-relaxed text-white/68 md:text-lg">
              {person.parents.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            {person.instagram ? (
              <a
                href={person.instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/55 transition hover:text-white"
              >
                Follow Story
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
          </motion.div>
        </RevealOnScroll>
      )}
    </div>
  );
}

function TimelineEntryRow({
  entry,
  index,
}: {
  entry: InvitationConfig['story']['timeline'][number];
  index: number;
}) {
  const rowParallax = useSectionParallax<HTMLDivElement>({y: [-28, 34]});
  const headingY = useTransform(rowParallax.progress, [0, 1], rowParallax.shouldReduceMotion ? [0, 0] : [-24, 22]);
  const copyY = useTransform(rowParallax.progress, [0, 1], rowParallax.shouldReduceMotion ? [0, 0] : [28, -18]);

  return (
    <div
      ref={rowParallax.ref}
      className="grid gap-10 border-b border-white/8 pb-14 last:border-b-0 last:pb-0 md:grid-cols-[260px_1fr] lg:grid-cols-[320px_1fr]"
    >
      <RevealOnScroll direction={index % 2 === 0 ? 'up' : 'right'}>
        <motion.div style={{y: headingY}}>
          <p className="font-display text-5xl italic text-[#d8b181] md:text-6xl">
            {entry.year}
          </p>
          <p className="mt-4 text-lg text-white/88">/ {entry.title}</p>
        </motion.div>
      </RevealOnScroll>
      <RevealOnScroll delay={0.12}>
        <motion.div style={{y: copyY}} className="space-y-5 text-base leading-relaxed text-white/72 md:text-lg">
          {entry.body.split('\n\n').map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </motion.div>
      </RevealOnScroll>
    </div>
  );
}

function EventDetailRow({
  detail,
  index,
}: {
  detail: InvitationConfig['events']['details'][number];
  index: number;
}) {
  const rowParallax = useSectionParallax<HTMLDivElement>({y: [-18, 24]});
  const rowY = useTransform(
    rowParallax.progress,
    [0, 1],
    rowParallax.shouldReduceMotion
      ? [0, 0]
      : [index % 2 === 0 ? -20 : 20, index % 2 === 0 ? 18 : -18],
  );

  return (
    <div ref={rowParallax.ref}>
      <RevealOnScroll delay={index * 0.06}>
        <motion.article style={{y: rowY}} className="grid gap-6 border-t border-black/10 pt-7 md:grid-cols-[220px_1fr_auto] md:items-start">
          <div>
            <h3 className="text-xl leading-tight text-black">{detail.title}</h3>
            {detail.time ? (
              <p className="mt-2 text-[11px] uppercase tracking-[0.28em] text-black/45">
                {detail.time}
              </p>
            ) : null}
          </div>

          <div className="space-y-3 text-base leading-relaxed text-black/68">
            {detail.location ? <p>{detail.location}</p> : null}
            {detail.text ? <p>{detail.text}</p> : null}
          </div>

          {detail.link ? (
            <a
              href={detail.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-black/55 transition hover:text-black"
            >
              {detail.linkLabel ?? 'Open'}
              <ArrowRight className="h-4 w-4" />
            </a>
          ) : null}
        </motion.article>
      </RevealOnScroll>
    </div>
  );
}

function VideoSection({
  invitation,
  onOpenVideo,
}: {
  invitation: InvitationConfig;
  onOpenVideo: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [hovering, setHovering] = useState(false);
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);

  return (
    <section className="bg-[#000000] md:h-screen">
      <div
        className="group relative h-[56.25vw] md:h-full w-full"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onMouseMove={(event) => {
          cursorX.set(event.clientX);
          cursorY.set(event.clientY);
        }}
      >
        <button type="button" onClick={onOpenVideo} className="block h-full w-full">
          <img
            src={invitation.media.videoPoster}
            alt="Wedding film poster"
            className="h-full w-full object-cover hover:brightness-100"
            referrerPolicy="no-referrer"
          />
        </button>

        <AnimatePresence>
          {hovering && !shouldReduceMotion ? (
            <motion.div
              initial={{opacity: 0, scale: 0.9}}
              animate={{opacity: 1, scale: 1}}
              exit={{opacity: 0, scale: 0.9}}
              className="pointer-events-none fixed z-[96] hidden h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/14 bg-black/72 text-[11px] uppercase tracking-[0.35em] text-white backdrop-blur-md md:flex"
              style={{left: cursorX, top: cursorY}}
            >
              PLAY
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}

function GallerySection({
  invitation,
  onOpenImage,
}: {
  invitation: InvitationConfig;
  onOpenImage: (image: string) => void;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const leftColumnRef = useRef<HTMLDivElement | null>(null);
  const leftRailRef = useRef<HTMLDivElement | null>(null);
  const [leftRailStyle, setLeftRailStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const section = sectionRef.current;
    const leftColumn = leftColumnRef.current;
    const leftRail = leftRailRef.current;

    if (!section || !leftColumn || !leftRail) return;

    let frame = 0;

    const updateRail = () => {
      frame = 0;

      if (window.innerWidth < 768) {
        setLeftRailStyle({});
        return;
      }

      const topOffset = 0;
      const sectionRect = section.getBoundingClientRect();
      const leftColumnRect = leftColumn.getBoundingClientRect();
      const railHeight = leftRail.offsetHeight;

      if (sectionRect.top > topOffset) {
        setLeftRailStyle({});
        return;
      }

      if (sectionRect.bottom <= topOffset + railHeight) {
        setLeftRailStyle({position: 'absolute', left: 0, right: 0, bottom: 0});
        return;
      }

      setLeftRailStyle({
        position: 'fixed',
        top: topOffset,
        left: leftColumnRect.left,
        width: leftColumnRect.width,
      });
    };

    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateRail);
    };

    updateRail();
    window.addEventListener('scroll', scheduleUpdate, {passive: true});
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, []);

  return (
    <section ref={sectionRef} id="gallery" className="bg-[#cfcfcf] px-5 py-24 text-[#111] md:px-10">
      {/* Mobile: Full width text header */}
      <div className="mb-12 md:hidden sticky top-0 bg-[#cfcfcf] py-4 -mx-5 px-5 z-10">
        <p className="text-[10px] uppercase tracking-[0.4em] text-black/45">Gallery</p>
        <h2 className="mt-4 font-display text-4xl italic leading-[0.92]">
          Our Pre-wedding Celebration.
        </h2>
      </div>

      <div className="mx-auto max-w-[1440px] md:grid md:grid-cols-[minmax(240px,0.68fr)_1fr] md:items-stretch md:gap-10 lg:grid-cols-[minmax(280px,0.72fr)_1fr] lg:gap-12 xl:gap-16">
        <div ref={leftColumnRef} className="hidden md:block relative mb-8 md:mb-0">
          <div
            ref={leftRailRef}
            style={leftRailStyle}
            className="z-30 bg-[#cfcfcf] pb-5 pt-6 md:sticky md:top-0 md:pb-8 md:pt-10 lg:pt-14"
          >
            <div className="max-w-[22rem] pr-4">
            <p className="text-[10px] uppercase tracking-[0.4em] text-black/45">Gallery</p>
            <h2 className="mt-4 font-display text-4xl italic leading-[0.92] md:text-6xl lg:text-7xl">
              Our Pre-wedding Celebration.
            </h2>
            </div>
          </div>
        </div>

        {/* Mobile: 20% left empty, 80% right for images */}
        <div className="grid grid-cols-[20%_80%] gap-0 md:hidden">
          <div></div>
          <div className="space-y-8">
            {invitation.media.gallery.map((image, index) => (
              <div key={image}>
                <GalleryCard image={image} index={index} onOpenImage={onOpenImage} />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: original layout */}
        <div className="hidden md:block space-y-8">
          {invitation.media.gallery.map((image, index) => (
            <div key={image}>
              <GalleryCard image={image} index={index} onOpenImage={onOpenImage} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GalleryCard({
  image,
  index,
  onOpenImage,
}: {
  image: string;
  index: number;
  onOpenImage: (image: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpenImage(image)}
      className="block w-full bg-white/40 text-left"
    >
      <img
        src={image}
        alt={`Gallery ${index + 1}`}
        className="h-full w-full object-cover"
        referrerPolicy="no-referrer"
      />
    </button>
  );
}

function ThankYouSection({invitation}: {invitation: InvitationConfig}) {
  const thanksParallax = useSectionParallax<HTMLElement>({y: [-24, 30]});
  const imageFloat = useTransform(thanksParallax.progress, [0, 1], thanksParallax.shouldReduceMotion ? [0, 0] : [-18, 24]);
  const textFloat = useTransform(thanksParallax.progress, [0, 1], thanksParallax.shouldReduceMotion ? [0, 0] : [-14, 14]);
  const guestPairLabel = invitation.couple.joinedName.replace(/\s*&\s*/g, ' - ').toUpperCase();

  return (
    <section className="bg-[#000000] min-h-screen px-5 py-10 text-white md:px-10 md:py-8">
      <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col">
        <div className="flex flex-1 items-center justify-center py-12 md:py-16">
          <RevealOnScroll className="mx-auto flex w-full max-w-[980px] flex-col items-center text-center">
            <motion.div style={{y: textFloat}} className="flex items-end justify-center gap-3 sm:gap-5 md:gap-6">
              <span className="font-display text-[3.3rem] font-medium leading-none tracking-[-0.04em] text-[#a9a4a0] sm:text-[4.3rem] md:text-[5.6rem] lg:text-[6.5rem]">
                {invitation.footer.closingTitle[0]}
              </span>
              <motion.div
                style={{y: imageFloat}}
                className="h-[44px] w-[72px] overflow-hidden bg-[#121212] shadow-[0_10px_26px_rgba(0,0,0,0.35)] sm:h-[50px] sm:w-[86px] md:h-[62px] md:w-[106px]"
              >
                <img
                  src={invitation.media.thankYouImage}
                  alt="Thank you portrait"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              <span className="font-display text-[3.3rem] italic leading-none tracking-[-0.04em] text-[#a9a4a0] sm:text-[4.3rem] md:text-[5.6rem] lg:text-[6.5rem]">
                {invitation.footer.closingTitle[1]}
              </span>
            </motion.div>

            <motion.p
              style={{y: textFloat}}
              className="mt-6 max-w-[860px] font-display text-[2.1rem] leading-[1.04] tracking-[-0.02em] text-[#a9a4a0] sm:mt-7 sm:text-[2.6rem] md:text-[3.5rem] lg:text-[4.15rem]"
            >
              {invitation.footer.closingText}
            </motion.p>

            <motion.p style={{y: textFloat}} className="mt-5 text-[10px] uppercase tracking-[0.28em] text-[#8a8580] md:mt-6 md:text-[11px]">
              {guestPairLabel}
            </motion.p>
          </RevealOnScroll>
        </div>

        <div className="flex flex-col items-center gap-2 pb-3 text-center">
          <a
            href={invitation.footer.creditUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-[8px] uppercase tracking-[0.24em] text-white/42 transition hover:text-white/80 md:text-[9px]"
          >
            {invitation.footer.creditLabel}
            <ExternalLink className="h-3 w-3" />
          </a>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[8px] uppercase tracking-[0.22em] text-white/50 md:text-[9px]">
            {invitation.footer.links.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 transition hover:text-white/82"
              >
                <FooterLinkIcon label={link.label} />
                <span>{link.label}</span>
              </a>
            ))}
          </div>

          <p className="text-[8px] text-white/38 md:text-[9px]">
            &copy; All rights reserved by groovepublic
          </p>
        </div>
      </div>
    </section>
  );
}

function FooterLinkIcon({label}: {label: string}) {
  const normalized = label.toLowerCase();

  if (normalized.includes('groovepublic.id')) {
    return <Instagram className="h-3 w-3" />;
  }

  if (normalized.includes('groovepublic.com')) {
    return <Globe className="h-3 w-3" />;
  }

  return <MessageCircle className="h-3 w-3" />;
}

function GiftCard({
  account,
  copiedAccount,
  onCopy,
}: {
  account: GiftAccount;
  copiedAccount: string | null;
  onCopy: () => Promise<void>;
}) {
  const copied = copiedAccount === account.number;

  return (
    <div className="rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-6">
      <p className="text-[10px] uppercase tracking-[0.34em] text-white/45">{account.bank}</p>
      <h3 className="mt-6 font-display text-4xl italic text-white">{account.number}</h3>
      <p className="mt-4 text-sm leading-relaxed text-white/62">{account.holder}</p>
      <button
        type="button"
        onClick={onCopy}
        className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-white/72 transition hover:border-white/18 hover:text-white"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Copied' : 'Copy Number'}
      </button>
    </div>
  );
}
