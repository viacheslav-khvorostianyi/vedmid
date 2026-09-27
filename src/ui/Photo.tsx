import { cn } from '@/lib/cn';

interface PhotoProps {
  src?: string | null;
  alt: string;
  aspect?: 'wide' | 'video';
  className?: string;
}

/** Dish photo with a fixed aspect ratio (no layout shift). Green placeholder until a photo exists. */
export default function Photo({ src, alt, aspect = 'wide', className }: PhotoProps) {
  const box = cn(
    'w-full max-w-full overflow-hidden rounded-ui bg-green',
    aspect === 'wide' ? 'aspect-[16/10]' : 'aspect-video',
    className,
  );
  if (!src) {
    return (
      <div
        className={cn(box, 'flex items-center justify-center text-sm text-on-green-strong')}
        role="img"
        aria-label={alt}
      >
        фото подачі
      </div>
    );
  }
  return (
    <div className={box}>
      <img src={src} alt={alt} loading="lazy" decoding="async" className="size-full object-cover" />
    </div>
  );
}
