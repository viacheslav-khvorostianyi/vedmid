describe('photoUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('returns null without a photo', async () => {
    const { photoUrl } = await import('./storage');
    expect(photoUrl(null)).toBeNull();
    expect(photoUrl('')).toBeNull();
  });

  it('serves the uploaded file as-is by default (free plan)', async () => {
    const { photoUrl } = await import('./storage');
    expect(photoUrl('item-1/a.webp')).toBe(
      'http://127.0.0.1:54321/storage/v1/object/public/dish-photos/item-1/a.webp',
    );
  });

  it('uses the resize endpoint when transforms are enabled', async () => {
    vi.stubEnv('VITE_SUPABASE_IMAGE_TRANSFORMS', 'true');
    const { photoUrl } = await import('./storage');
    const url = new URL(photoUrl('item-1/a.webp', 800)!);
    expect(url.pathname).toBe('/storage/v1/render/image/public/dish-photos/item-1/a.webp');
    expect(url.searchParams.get('width')).toBe('800');
  });
});
