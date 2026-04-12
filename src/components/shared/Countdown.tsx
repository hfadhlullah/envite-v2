import {useEffect, useMemo, useState} from 'react';

type CountdownProps = {
  target: string;
};

function getTimeParts(target: string) {
  const difference = new Date(target).getTime() - Date.now();

  if (difference <= 0) {
    return {days: 0, hours: 0, minutes: 0, seconds: 0};
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((difference / (1000 * 60)) % 60);
  const seconds = Math.floor((difference / 1000) % 60);

  return {days, hours, minutes, seconds};
}

export function Countdown({target}: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeParts(target));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft(getTimeParts(target));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [target]);

  const items = useMemo(
    () => [
      {label: 'D', value: timeLeft.days},
      {label: 'H', value: timeLeft.hours},
      {label: 'M', value: timeLeft.minutes},
      {label: 'S', value: timeLeft.seconds},
    ],
    [timeLeft],
  );

  return (
    <div className="flex w-full flex-wrap justify-between gap-2 md:gap-20">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-1 min-w-[40px] md:min-w-[40px] flex-col items-center px-1 md:px-8 py-2 md:py-4 text-center"
        >
          <span className="font-[inherit] text-5xl md:text-9xl leading-none text-white">
            {String(item.value).padStart(2, '0')}
          </span>
          <span className="mt-1 md:mt-1 text-[8px] md:text-[10px] uppercase tracking-[0.4em] text-white/55">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
