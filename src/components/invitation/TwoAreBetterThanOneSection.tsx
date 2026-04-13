import React, {useEffect, useMemo, useRef, useState} from 'react';
import {motion, useReducedMotion, useScroll, useTransform} from 'framer-motion';
import type {MotionValue} from 'framer-motion';

import type {InvitationConfig} from '@/src/types/invitation';

type TwoAreBetterThanOneSectionProps = {
  invitation: InvitationConfig;
};

type RailImage = {
  src: string;
  alt: string;
  speed: number;
  drift: number;
  aspectClassName: string;
};

type RailImageCardProps = {
  image: RailImage;
  progress: MotionValue<number>;
  direction: 1 | -1;
  className?: string;
  shouldReduceMotion: boolean;
};

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1472515112791-2c7d8d53f2d8?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1460978812857-470ed1c77af0?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b9aa?auto=format&fit=crop&w=1200&q=80',
];

export function TwoAreBetterThanOneSection({invitation}: TwoAreBetterThanOneSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const centerSlotRef = useRef<HTMLDivElement | null>(null);
  const centerRailRef = useRef<HTMLDivElement | null>(null);
  const [centerRailStyle, setCenterRailStyle] = useState<React.CSSProperties>({});
  const shouldReduceMotion = useReducedMotion();
  const {scrollYProgress} = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });
  
  const smoothProgress = scrollYProgress;

  const pool = useMemo(() => {
    const images = [
      ...invitation.media.quoteImages,
      ...invitation.media.gallery,
      ...FALLBACK_IMAGES,
    ];
    return images.filter(Boolean);
  }, [invitation.media.gallery, invitation.media.quoteImages]);

  const leftRail = useMemo<RailImage[]>(
    () => [
      {src: pool[0], alt: 'Left memory 1', speed: 0.32, drift: 120, aspectClassName: 'aspect-[4/5]'},
      {src: pool[1], alt: 'Left memory 2', speed: 0.58, drift: 160, aspectClassName: 'aspect-square'},
      {src: pool[2], alt: 'Left memory 3', speed: 0.86, drift: 200, aspectClassName: 'aspect-[5/6]'},
      {src: pool[3], alt: 'Left memory 4', speed: 1.12, drift: 240, aspectClassName: 'aspect-[4/5]'},
    ],
    [pool],
  );

  const rightRail = useMemo<RailImage[]>(
    () => [
      {src: pool[4], alt: 'Right memory 1', speed: 0.44, drift: 130, aspectClassName: 'aspect-[4/5]'},
      {src: pool[5], alt: 'Right memory 2', speed: 0.74, drift: 170, aspectClassName: 'aspect-[5/4]'},
      {src: pool[6], alt: 'Right memory 3', speed: 1.02, drift: 220, aspectClassName: 'aspect-[4/5]'},
      {src: pool[7], alt: 'Right memory 4', speed: 1.24, drift: 280, aspectClassName: 'aspect-[5/6]'},
    ],
    [pool],
  );

  useEffect(() => {
    const section = sectionRef.current;
    const slot = centerSlotRef.current;
    const rail = centerRailRef.current;

    if (!section || !slot || !rail) return;

    let frame = 0;

    const updateRail = () => {
      frame = 0;

      const topOffset = 0;
      const sectionRect = section.getBoundingClientRect();
      const slotRect = slot.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      if (sectionRect.top > topOffset) {
        setCenterRailStyle({});
        return;
      }

      if (sectionRect.bottom <= topOffset + viewportHeight) {
        setCenterRailStyle({
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          top: 'auto',
          width: '100%',
          height: '100vh',
        });
        return;
      }

      setCenterRailStyle({
        position: 'fixed',
        top: topOffset,
        left: slotRect.left,
        width: slotRect.width,
        height: '100vh',
        right: 'auto',
        bottom: 'auto',
        transform: 'none',
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
    <section
      ref={sectionRef}
      className="relative bg-[#000000] px-4 md:min-h-[220vh] md:px-10"
    >
      <div className="mx-auto max-w-[1440px] py-10 pb-10 md:py-16">
        <div className="hidden md:grid md:grid-cols-[minmax(130px,0.36fr)_minmax(760px,1.42fr)_minmax(130px,0.36fr)] md:items-stretch md:gap-6 lg:grid-cols-[minmax(150px,0.38fr)_minmax(860px,1.54fr)_minmax(150px,0.38fr)] lg:gap-10">
          <div className="space-y-[34vh] pt-[9vh]">
            {leftRail.map((image, index) => (
              <div key={image.src + image.alt}>
                <RailImageCard
                  image={image}
                  progress={smoothProgress}
                  shouldReduceMotion={Boolean(shouldReduceMotion)}
                  direction={index % 2 === 0 ? 1 : -1}
                  className={index % 2 === 0 ? 'ml-0 max-w-[142px]' : 'ml-8 max-w-[126px]'}
                />
              </div>
            ))}
          </div>

          <div ref={centerSlotRef} className="relative min-h-[270vh] md:min-h-[320vh]">
            <div
              ref={centerRailRef}
              style={centerRailStyle}
              className="z-30 flex h-screen items-start justify-center bg-transparent pt-[14vh]"
            >
              <div className="mx-auto max-w-[980px] text-center">
                <h2 className="font-display text-[clamp(4.8rem,8.1vw,7.9rem)] leading-[0.9] tracking-[-0.055em] text-[#c89b80]">
                  <span className="block whitespace-nowrap">Two are better than one,</span>
                  <span className="block whitespace-nowrap">for they have a good</span>
                  <span className="block whitespace-nowrap">return for their labor</span>
                </h2>
                <p className="mt-8 text-[11px] uppercase tracking-[0.38em] text-white/32">Ecclesiastes 4:9</p>
              </div>
            </div>
          </div>

          <div className="space-y-[36vh] pt-[15vh]">
            {rightRail.map((image, index) => (
              <div key={image.src + image.alt}>
                <RailImageCard
                  image={image}
                  progress={smoothProgress}
                  shouldReduceMotion={Boolean(shouldReduceMotion)}
                  direction={index % 2 === 0 ? -1 : 1}
                  className={index % 2 === 0 ? 'mr-6 ml-auto max-w-[126px]' : 'mr-0 ml-auto max-w-[142px]'}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[43%_57%] items-start gap-4 md:hidden">
          <div className="sticky top-0 z-40 h-screen self-start bg-black px-2 py-4">
            <div className="pt-1">
              <h2 className="font-display text-[2.9rem] leading-[0.92] tracking-[-0.05em] text-[#c89b80]">
                Two are better than one,
                <br />
                for they have a good
                <br />
                return for their labor
              </h2>
              <p className="mt-3 max-w-[18ch] text-[10px] uppercase tracking-[0.36em] text-white/38">
                Ecclesiastes 4:9
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {leftRail.concat(rightRail).map((image, index) => (
              <div key={`${image.src}-${index}`}>
                <RailImageCard
                  image={{...image, speed: Math.max(0.24, image.speed * 0.6), drift: image.drift * 0.44}}
                  progress={smoothProgress}
                  shouldReduceMotion={Boolean(shouldReduceMotion)}
                  direction={index % 2 === 0 ? 1 : -1}
                  className={index % 3 === 0 ? 'mt-6' : ''}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function RailImageCard({
  image,
  progress,
  direction,
  className,
  shouldReduceMotion,
}: RailImageCardProps) {
  const travel = image.drift * image.speed * direction;
  const y = useTransform(progress, [0, 1], shouldReduceMotion ? [0, 0] : [-travel, travel]);

  return (
    <motion.figure style={{y}} className={className}>
      <img
        src={image.src}
        alt={image.alt}
        className={`${image.aspectClassName} w-full object-contain shadow-[0_20px_48px_rgba(0,0,0,0.35)] will-change-transform`}
        referrerPolicy="no-referrer"
      />
    </motion.figure>
  );
}
