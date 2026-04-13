"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";

type GalleryImage = {
  url: string;
  caption?: string;
  copyright?: string;
};

export default function PhotoGallery({ images }: { images: GalleryImage[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const close = useCallback(() => setLightboxIndex(null), []);
  const prev = useCallback(
    () =>
      setLightboxIndex((i) =>
        i !== null ? (i - 1 + images.length) % images.length : null
      ),
    [images.length]
  );
  const next = useCallback(
    () =>
      setLightboxIndex((i) =>
        i !== null ? (i + 1) % images.length : null
      ),
    [images.length]
  );

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightboxIndex, close, prev, next]);

  // Assign varied sizes for masonry-like look
  function getSpan(index: number, total: number) {
    if (total <= 2) return "col-span-1";
    // First image is large
    if (index === 0) return "col-span-2 row-span-2";
    // Every 5th image after that is wide
    if ((index - 1) % 4 === 2) return "col-span-2";
    return "col-span-1";
  }

  return (
    <>
      {/* Masonry grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 auto-rows-[160px] sm:auto-rows-[200px] gap-2">
        {images.map((img, i) => (
          <div
            key={i}
            className={`${getSpan(i, images.length)} relative rounded-lg overflow-hidden cursor-pointer group`}
            onClick={() => setLightboxIndex(i)}
          >
            <Image
              src={img.url}
              alt={img.caption || `Photo ${i + 1}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            {/* Overlay avec légende/crédits au hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
              {(img.caption || img.copyright) && (
                <div>
                  {img.caption && <p className="text-white text-sm leading-tight">{img.caption}</p>}
                  {img.copyright && <p className="text-white/60 text-xs mt-0.5">{img.copyright}</p>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox / Diaporama */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={close}
        >
          {/* Close button */}
          <button
            onClick={close}
            className="absolute top-4 right-4 text-white/70 hover:text-white z-10 p-2"
            aria-label="Fermer"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Previous */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-10 p-2"
              aria-label="Photo précédente"
            >
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Image */}
          <div
            className="relative max-w-[90vw] max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[lightboxIndex].url}
              alt={images[lightboxIndex].caption || `Photo ${lightboxIndex + 1}`}
              width={1200}
              height={800}
              className="max-h-[80vh] w-auto h-auto object-contain rounded-lg"
              sizes="90vw"
              priority
            />
            {/* Légende, crédits, compteur */}
            <div className="mt-3 text-center space-y-1">
              {images[lightboxIndex].caption && (
                <p className="text-white/80 text-sm">{images[lightboxIndex].caption}</p>
              )}
              {images[lightboxIndex].copyright && (
                <p className="text-white/50 text-xs">{images[lightboxIndex].copyright}</p>
              )}
              <p className="text-white/30 text-xs">
                {lightboxIndex + 1} / {images.length}
              </p>
            </div>
          </div>

          {/* Next */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-10 p-2"
              aria-label="Photo suivante"
            >
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      )}
    </>
  );
}
