export function orderPressPhotos<T extends { id: number | string }>(photos: T[], ids?: (number | string)[]): T[] {
  const remaining = new Map(photos.map((photo) => [String(photo.id), photo]))
  const ordered: T[] = []
  for (const id of Array.isArray(ids) ? ids : []) {
    const photo = remaining.get(String(id))
    if (!photo) continue
    ordered.push(photo)
    remaining.delete(String(id))
  }
  return [...ordered, ...remaining.values()]
}
