const originals = new Map<string, Promise<HTMLImageElement>>();
/** Cache decoded originals only, never an object-sized or transformed bitmap. */
export function decodeOriginal(src: string): Promise<HTMLImageElement> {
  let promise = originals.get(src);
  if (!promise) {
    const image = new window.Image();
    image.decoding = "async";
    image.src = src;
    promise = image
      .decode()
      .then(() => image)
      .catch((error: unknown) => {
        originals.delete(src);
        throw error;
      });
    originals.set(src, promise);
  }
  return promise;
}
