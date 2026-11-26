import { cn } from '@/lib/cn';

interface PhotoProps {
  src?: string | null;
  alt: string;
  aspect?: 'wide' | 'video';
  /** Attribution of an illustrative stock photo; shows the «ілюстративне фото» caption */
  credit?: { text: string; url: string } | null;
  className?: string;
}

/** Dish photo with a fixed aspect ratio (no layout shift). Green placeholder until a photo exists. */
export default function Photo({ src, alt, aspect = 'wide', credit, className }: PhotoProps) {
  const box = cn(
    'w-full max-w-full overflow-hidden rounded-ui bg-green',
    aspect === 'wide' ? 'aspect-[16/10]' : 'aspect-video',
  );
  if (!src) {
    return (
      <div
        className={cn(box, 'flex items-center justify-center text-sm text-on-green-strong', className)}
        role="img"
        aria-label={alt}
      >
        фото подачі
      </div>
    );
  }
  const image = (
    <div className={box}>
      <img src={src} alt={alt} loading="lazy" decoding="async" className="size-full object-cover" />
    </div>
  );
  if (!credit) return <div className={className}>{image}</div>;
  return (
    <figure className={cn('m-0', className)}>
      {image}
      <figcaption className="mt-1.5 text-[11px] leading-snug text-muted">
        ілюстративне фото ·{' '}
        <a href={credit.url} target="_blank" rel="noreferrer noopener" className="underline hover:text-text">
          {credit.text}
        </a>
      </figcaption>
    </figure>
  );
}
