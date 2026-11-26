import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, Images, X } from "lucide-react";
import { createPortal } from "react-dom";
import { ListingMediaPlaceholder } from "./listing-media-placeholder";
import type { ListingPhoto } from "@/lib/types";
import { cn } from "@/lib/cn";

interface PhotoGalleryProps {
  photos: ListingPhoto[];
  title: string;
  kind?: "property" | "room";
}

export function PhotoGallery({ photos, title, kind = "property" }: PhotoGalleryProps) {
  const validPhotos = photos.filter((p) => Boolean(p.url));
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [photos.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev + 1) % validPhotos.length
        );
      }
      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev - 1 + validPhotos.length) % validPhotos.length
        );
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightboxIndex, validPhotos.length]);

  if (validPhotos.length === 0) {
    return (
      <ListingMediaPlaceholder
        kind={kind}
        label="Photos not yet uploaded — schedule an in-person visit to inspect"
        className="h-64 sm:h-80 w-full rounded-xl border border-edge"
      />
    );
  }

  if (validPhotos.length === 1) {
    return (
      <>
        <button
          type="button"
          onClick={() => setLightboxIndex(0)}
          className="group relative block h-64 sm:h-96 w-full overflow-hidden rounded-xl border border-edge bg-inset text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <img
            src={validPhotos[0].url!}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
          />
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-md border border-edge bg-card/90 px-2.5 py-1 text-xs font-medium text-fg backdrop-blur">
            <Expand className="h-3.5 w-3.5" />
            Expand photo
          </span>
        </button>

        {lightboxIndex !== null && (
          <Lightbox
            photos={validPhotos}
            title={title}
            index={lightboxIndex}
            onChangeIndex={setLightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </>
    );
  }

  const secondary = validPhotos.slice(1, 3);

  return (
    <>
      {/* Desktop asymmetric frame + Mobile active viewer */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => setLightboxIndex(activeIndex)}
            className="group relative md:col-span-2 h-64 sm:h-80 md:h-96 w-full overflow-hidden rounded-xl border border-edge bg-inset cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <img
              src={validPhotos[activeIndex]?.url || validPhotos[0].url!}
              alt={`${title} — photo ${activeIndex + 1}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
            />
            <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-md border border-edge bg-card/90 px-2.5 py-1 text-xs font-medium text-fg backdrop-blur md:hidden">
              <Images className="h-3.5 w-3.5" />
              {activeIndex + 1} / {validPhotos.length}
            </span>
          </button>

          <div className="hidden md:grid grid-rows-2 gap-2.5 h-96">
            {secondary.map((photo, idx) => {
              const realIndex = idx + 1;
              const isLastSlot = idx === secondary.length - 1;
              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setLightboxIndex(realIndex)}
                  className="group relative h-full w-full overflow-hidden rounded-xl border border-edge bg-inset cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <img
                    src={photo.url!}
                    alt={`${title} — photo ${realIndex + 1}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  {isLastSlot && (
                    <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-md border border-edge bg-card/95 px-2.5 py-1 text-xs font-medium text-fg shadow-soft">
                      <Images className="h-3.5 w-3.5" />
                      All {validPhotos.length} photos
                    </span>
                  )}
                </button>
              );
            })}
            {secondary.length === 1 && (
              <ListingMediaPlaceholder
                kind={kind}
                label="Click any photo to view full screen"
                className="h-full w-full rounded-xl border border-edge"
              />
            )}
          </div>
        </div>

        {/* Mobile / Tablet Thumbnail Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:hidden">
          {validPhotos.map((photo, idx) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={cn(
                "relative h-14 w-20 shrink-0 overflow-hidden rounded-md border transition-all cursor-pointer",
                idx === activeIndex
                  ? "border-accent ring-2 ring-accent/30"
                  : "border-edge opacity-75 hover:opacity-100"
              )}
            >
              <img
                src={photo.url!}
                alt={`Thumbnail ${idx + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={validPhotos}
          title={title}
          index={lightboxIndex}
          onChangeIndex={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}

function Lightbox({
  photos,
  title,
  index,
  onChangeIndex,
  onClose,
}: {
  photos: ListingPhoto[];
  title: string;
  index: number;
  onChangeIndex: (next: number) => void;
  onClose: () => void;
}) {
  const current = photos[index] || photos[0];

  const node = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} gallery`}
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/92 backdrop-blur-sm animate-fade-in"
    >
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 text-white">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="text-xs text-slate-400 tabular-nums">
            Photo {index + 1} of {photos.length}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1.5 text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer"
          aria-label="Close gallery"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center p-4 sm:p-8 min-h-0">
        {photos.length > 1 && (
          <button
            type="button"
            onClick={() => onChangeIndex((index - 1 + photos.length) % photos.length)}
            className="absolute left-3 sm:left-6 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-900/80 text-white hover:bg-slate-800 cursor-pointer"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <img
          src={current.url!}
          alt={`${title} — photo ${index + 1}`}
          className="max-h-full max-w-full rounded-lg object-contain select-none"
        />

        {photos.length > 1 && (
          <button
            type="button"
            onClick={() => onChangeIndex((index + 1) % photos.length)}
            className="absolute right-3 sm:right-6 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-900/80 text-white hover:bg-slate-800 cursor-pointer"
            aria-label="Next photo"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(node, document.body) : node;
}
