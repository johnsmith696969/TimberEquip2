import React from 'react';
import { useTheme } from './ThemeContext';

interface ImageHeroProps {
  imageSrc: string;
  imageAlt: string;
  children: React.ReactNode;
  sectionClassName?: string;
  contentClassName?: string;
  imageClassName?: string;
  imageWidth?: number;
  imageHeight?: number;
}

export function ImageHero({
  imageSrc,
  imageAlt,
  children,
  sectionClassName = '',
  contentClassName = '',
  imageClassName = '',
  imageWidth = 1920,
  imageHeight = 1080,
}: ImageHeroProps) {
  const { theme } = useTheme();
  const shadowOverlay = theme === 'light' ? 'bg-black/30' : 'bg-black/58';
  const gradientOverlay =
    theme === 'light'
      ? 'bg-[linear-gradient(90deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.90)_34%,rgba(255,255,255,0.55)_70%,rgba(255,255,255,0.35)_100%)]'
      : 'bg-[linear-gradient(90deg,rgba(10,10,10,0.92)_0%,rgba(10,10,10,0.80)_36%,rgba(10,10,10,0.36)_72%,rgba(10,10,10,0.12)_100%)]';

  return (
    <section className={`relative flex min-h-[50vh] items-center overflow-hidden border-b border-line px-4 py-16 md:min-h-[55vh] md:px-8 md:py-24 ${sectionClassName}`.trim()}>
      <div className="absolute inset-0 bg-ink">
        <img
          src={imageSrc}
          alt={imageAlt}
          width={imageWidth}
          height={imageHeight}
          className={`absolute inset-0 h-full w-full object-cover ${imageClassName}`.trim()}
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
        <div className={`absolute inset-0 ${shadowOverlay}`}></div>
        <div className={`absolute inset-0 ${gradientOverlay}`}></div>
      </div>

      <div className={`relative z-10 mx-auto w-full max-w-[1600px] ${contentClassName}`.trim()}>
        {children}
      </div>
    </section>
  );
}
