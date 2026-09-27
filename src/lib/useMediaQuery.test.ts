import { act, renderHook } from '@testing-library/react';
import { setViewportWidth } from '@/test/matchMedia';
import { useIsDesktop } from './useMediaQuery';

describe('useIsDesktop', () => {
  it('is false below 1024px and true from 1024px', () => {
    const { result } = renderHook(() => useIsDesktop());
    expect(result.current).toBe(false);
    act(() => setViewportWidth(1024));
    expect(result.current).toBe(true);
    act(() => setViewportWidth(1023));
    expect(result.current).toBe(false);
  });
});
