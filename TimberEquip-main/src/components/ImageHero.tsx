import React from 'react';

interface ImageHeroProps {
  imageSrc: string;
  imageAlt: string;
  children: React.ReactNode;
  sectionClassName?: string;
  contentClassName?: string;
  imageClassName?: string;
}

export function ImageHero({
  imageSrc,
  imageAlt,
  children,
  sectionClassName = '',
  contentClassName = '',
  imageClassName = '',
}: ImageHeroProps) {
  return (
    <section className={`relative flex min-h-[50vh] items-center overflow-hidden border-b border-line px-4 py-16 md:min-h-[55vh] md:px-8 md:py-24 ${sectionClassName}`.trim()}>
      <div className="absolute inset-0 bg-[#111827]">
        <img
          src={imageSrc}
          alt={imageAlt}
          className={`absolute inset-0 h-full w-full object-cover ${imageClassName}`.trim()}
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-black/30 dark:bg-black/58"></div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.90)_34%,rgba(255,255,255,0.55)_70%,rgba(255,255,255,0.35)_100%)] dark:bg-[linear-gradient(90deg,rgba(10,10,10,0.92)_0%,rgba(10,10,10,0.80)_36%,rgba(10,10,10,0.36)_72%,rgba(10,10,10,0.12)_100%)]"></div>
      </div>

      <div className={`relative z-10 mx-auto w-full max-w-[1600px] ${contentClassName}`.trim()}>
        {children}
      </div>
    </section>
  );
}
