import { Search, X } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

interface SearchInputProps extends Omit<ComponentProps<'input'>, 'value' | 'onChange' | 'type'> {
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** Accessible label (visually hidden) */
  label?: string;
}

export default function SearchInput({
  id,
  value,
  onChange,
  label = 'пошук',
  placeholder = 'пошук страви, вина, алергену…',
  className,
  ...rest
}: SearchInputProps) {
  return (
    <div className={cn('flex min-h-11 items-center gap-2.5 rounded-ui bg-green px-3.5', className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search aria-hidden="true" className="size-[18px] shrink-0 text-search-ph" strokeWidth={1.6} />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="search"
        className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] text-text outline-none placeholder:text-search-ph [&::-webkit-search-cancel-button]:hidden"
        {...rest}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="очистити пошук"
          className="-mr-2 inline-flex size-11 shrink-0 items-center justify-center text-search-ph hover:text-text"
        >
          <X aria-hidden="true" className="size-[18px]" strokeWidth={1.6} />
        </button>
      )}
    </div>
  );
}
