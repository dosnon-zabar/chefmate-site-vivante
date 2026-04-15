"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Step = {
  titre?: string | null;
  texte?: string | null;
  image_url?: string | null;
  sort_order: number;
};

export default function EventStepsCarousel({ etapes }: { etapes: Step[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Filter steps that have an image for the lightbox
  const stepsWithImage = etapes
    .map((e, originalIndex) => ({ ...e, originalIndex }))
    .filter((e) => !!e.image_url);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const prevLightbox = useCallback(
    () => setLightboxIndex((i) => (i !== null ? (i - 1 + stepsWithImage.length) % stepsWithImage.length : null)),
    [stepsWithImage.length]
  );
  const nextLightbox = useCallback(
    () => setLightboxIndex((i) => (i !== null ? (i + 1) % stepsWithImage.length : null)),
    [stepsWithImage.length]
  );

  useEffect(() => {
    if (lightboxIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevLightbox();
      if (e.key === "ArrowRight") nextLightbox();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightboxIndex, closeLightbox, prevLightbox, nextLightbox]);

  function openLightboxForStep(originalIndex: number) {
    const lightboxIdx = stepsWithImage.findIndex((s) => s.originalIndex === originalIndex);
    if (lightboxIdx >= 0) setLightboxIndex(lightboxIdx);
  }

  function updateScrollState() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    // Observer les enfants aussi : quand les images se chargent, leur taille change
    Array.from(el.children).forEach((child) => ro.observe(child));
    window.addEventListener("resize", updateScrollState);

    // Re-check après chargement de chaque image
    const imgs = el.querySelectorAll("img");
    imgs.forEach((img) => {
      if (!img.complete) img.addEventListener("load", updateScrollState, { once: true });
    });

    // Filet de sécurité : re-check plusieurs fois après mount
    const timers = [50, 200, 500, 1000].map((delay) => setTimeout(updateScrollState, delay));

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
      window.removeEventListener("resize", updateScrollState);
      timers.forEach(clearTimeout);
    };
  }, [etapes.length]);

  function scrollBy(direction: -1 | 1) {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8 * direction;
    el.scrollBy({ left: amount, behavior: "smooth" });
  }

  if (etapes.length === 0) return null;

  return (
    <div className="relative">
      {/* Arrows */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Étape précédente"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg border border-brun/10 flex items-center justify-center text-brun hover:text-vert-eau transition-colors"
          style={{ marginTop: "-3rem" }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Étape suivante"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg border border-brun/10 flex items-center justify-center text-brun hover:text-vert-eau transition-colors"
          style={{ marginTop: "-3rem" }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Scrollable carousel */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: "none" }}
      >
        {etapes.map((etape, i) => (
          <article
            key={i}
            className="flex-shrink-0 snap-start flex flex-col"
            style={{ maxWidth: etape.image_url ? undefined : "320px" }}
          >
            {etape.image_url && (
              <button
                type="button"
                onClick={() => openLightboxForStep(i)}
                className="cursor-zoom-in group/img overflow-hidden rounded-lg"
                aria-label="Agrandir l'image"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={etape.image_url}
                  alt={etape.titre || `Étape ${i + 1}`}
                  className="h-72 sm:h-80 w-auto object-cover transition-transform duration-300 group-hover/img:scale-105"
                />
              </button>
            )}
            {(etape.titre || etape.texte) && (
              <div
                className={`mt-3 ${etape.image_url ? "" : "pt-0"}`}
                style={{ maxWidth: etape.image_url ? "400px" : undefined }}
              >
                {etape.titre && (
                  <h3 className="font-serif text-2xl text-brun leading-tight">
                    {etape.titre}
                  </h3>
                )}
                {etape.texte && (
                  <p className="mt-2 text-sm text-brun-light leading-relaxed whitespace-pre-line">
                    {etape.texte}
                  </p>
                )}
              </div>
            )}
          </article>
        ))}
      </div>

      {/* Lightbox — scope limité aux images des étapes */}
      {lightboxIndex !== null && stepsWithImage[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/70 hover:text-white z-10 p-2"
            aria-label="Fermer"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {stepsWithImage.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevLightbox(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-10 p-2"
                aria-label="Étape précédente"
              >
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextLightbox(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-10 p-2"
                aria-label="Étape suivante"
              >
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <div
            className="flex flex-col items-center justify-center px-16 py-8 max-h-[100vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={stepsWithImage[lightboxIndex].image_url!}
              alt={stepsWithImage[lightboxIndex].titre || "Étape"}
              className="max-h-[85vh] max-w-[90vw] w-auto h-auto object-contain"
            />
            {(stepsWithImage[lightboxIndex].titre || stepsWithImage[lightboxIndex].texte) && (
              <div className="mt-3 text-center space-y-1" style={{ maxWidth: "90vw" }}>
                {stepsWithImage[lightboxIndex].titre && (
                  <p className="text-white text-lg font-medium">{stepsWithImage[lightboxIndex].titre}</p>
                )}
                {stepsWithImage[lightboxIndex].texte && (
                  <p className="text-white/70 text-sm whitespace-pre-line">{stepsWithImage[lightboxIndex].texte}</p>
                )}
              </div>
            )}
            <p className="text-white/30 text-xs mt-2">
              {lightboxIndex + 1} / {stepsWithImage.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
