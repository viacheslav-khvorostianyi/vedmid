import type { ReactNode } from 'react';
import { useIsDesktop } from '@/lib/useMediaQuery';

interface LayoutSwitchProps {
  mobile: ReactNode;
  desktop: ReactNode;
}

/** Picks the view for the current layout. The only place (with ShellLayout) that branches on viewport. */
export default function LayoutSwitch({ mobile, desktop }: LayoutSwitchProps) {
  return <>{useIsDesktop() ? desktop : mobile}</>;
}
