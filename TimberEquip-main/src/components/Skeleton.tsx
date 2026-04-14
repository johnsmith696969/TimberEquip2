import React from 'react';

const shimmer = 'animate-pulse bg-line/60 rounded-sm';

export function SkeletonCard() {
  return (
    <div className="border border-line p-4 space-y-4">
      <div className={`${shimmer} h-48 w-full`} />
      <div className={`${shimmer} h-4 w-3/4`} />
      <div className={`${shimmer} h-3 w-1/2`} />
      <div className="flex gap-2">
        <div className={`${shimmer} h-3 w-16`} />
        <div className={`${shimmer} h-3 w-16`} />
      </div>
      <div className={`${shimmer} h-6 w-24`} />
    </div>
  );
}

export function SkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`${shimmer} h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-line">
      <div className={`${shimmer} h-10 w-10 flex-shrink-0`} />
      <div className="flex-1 space-y-2">
        <div className={`${shimmer} h-3 w-1/3`} />
        <div className={`${shimmer} h-3 w-1/2`} />
      </div>
      <div className={`${shimmer} h-6 w-20`} />
    </div>
  );
}

export function SkeletonTableRows({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </>
  );
}
