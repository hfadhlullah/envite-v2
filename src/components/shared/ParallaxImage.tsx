import {motion, useReducedMotion, useScroll, useSpring, useTransform} from 'framer-motion';
import {useEffect, useRef, useState} from 'react';
import type {ReactNode, RefObject} from 'react';

import {usePointerParallax} from '@/src/components/shared/CinematicParallax';
import {cn} from '@/src/lib/utils';

type ParallaxImageProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  speed?: number;
  overlayOpacity?: number;
  children?: ReactNode;
  targetRef?: RefObject<HTMLElement | null>;
  mouseStrength?: number;
  enablePointer?: boolean;
};

export function ParallaxImage({
  src,
  alt,
  className,
  imageClassName,
  speed = 0.16,
  overlayOpacity = 0.18,
  children,
  targetRef,
  mouseStrength = 16,
  enablePointer = false,
}: ParallaxImageProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const target = targetRef?.current ?? rootRef.current;
    setIsHydrated(Boolean(target));
  });

  const {scrollYProgress} = useScroll({
    target: isHydrated ? (targetRef ?? rootRef) : undefined,
    offset: ['start end', 'end start'] as any,
  });
  const y = useSpring(
    useTransform(
      scrollYProgress,
      [0, 1],
      shouldReduceMotion ? [0, 0] : [-(speed * 240), speed * 240],
    ),
    {stiffness: 120, damping: 22, mass: 0.45},
  );
  const scale = useSpring(
    useTransform(scrollYProgress, [0, 1], shouldReduceMotion ? [1, 1] : [1.16, 1.03]),
    {stiffness: 120, damping: 22, mass: 0.45},
  );
  const pointer = usePointerParallax({strength: mouseStrength, rotate: mouseStrength / 2, disabled: !enablePointer});

  return (
    <div ref={rootRef} className={cn('relative overflow-hidden', className)}>
      <motion.div
        {...pointer.bind}
        style={{y, scale, ...pointer.style}}
        className="absolute inset-0 scale-[0.5]"
      >
        <img
          src={src}
          alt={alt}
          className={cn('h-full w-full object-cover', imageClassName)}
          referrerPolicy="no-referrer"
        />
        {overlayOpacity > 0 && (
          <div
            className="absolute inset-0 bg-black"
            style={{opacity: overlayOpacity}}
          />
        )}
      </motion.div>
      {children && <div className="relative z-10 h-full">{children}</div>}
    </div>
  );
}
