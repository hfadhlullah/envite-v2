export function getSlugFromPathname(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  return segments[0] ?? 'claire';
}

export function getGuestNameFromSearch(search: string, queryParam: string) {
  const params = new URLSearchParams(search);
  return params.get(queryParam) ?? 'Guest Name';
}

export function createQrValue(slug: string, guestName: string) {
  const safeName = guestName.trim().toLowerCase().replace(/\s+/g, '-');
  return safeName || 'guest';
}

export function getQrPreviewUrl(value: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(value)}`;
}
