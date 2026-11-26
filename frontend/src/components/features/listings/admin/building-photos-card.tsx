import { useRef } from "react";
import { ImagePlus, Star, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListingMediaPlaceholder } from "../listing-media-placeholder";
import type { ListingPhoto } from "@/lib/types";

interface BuildingPhotosCardProps {
  photos: ListingPhoto[];
  uploading: boolean;
  photoActionId: string | null;
  onUpload: (files: FileList | null) => void;
  onSetCover: (photo: ListingPhoto) => void;
  onDelete: (photo: ListingPhoto) => void;
}

export function BuildingPhotosCard({
  photos,
  uploading,
  photoActionId,
  onUpload,
  onSetCover,
  onDelete,
}: BuildingPhotosCardProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-fg">1. Building Photos</h2>
          <p className="text-xs text-muted">
            Show the building exterior, hallway, gate, or shared facilities. The Cover photo
            appears first on the catalog.
          </p>
        </div>

        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              onUpload(e.target.files);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            size="sm"
            loading={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus className="h-3.5 w-3.5" />
            Upload Building Photos
          </Button>
        </div>
      </div>

      {photos.length === 0 ? (
        <ListingMediaPlaceholder
          kind="property"
          label="No building photos yet — click Upload Building Photos to add exterior or common-area photos"
          className="h-40 w-full rounded-lg border border-dashed border-edge-strong"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative overflow-hidden rounded-lg border border-edge bg-inset"
            >
              <img src={photo.url || ""} alt="Building" className="h-32 w-full object-cover" />
              {photo.is_cover && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-card/95 px-1.5 py-0.5 text-[10px] font-semibold text-fg border border-edge">
                  <Star className="h-2.5 w-2.5 text-brand-gold fill-current" />
                  Cover
                </span>
              )}
              <div className="flex items-center justify-between gap-1 border-t border-edge bg-card px-2 py-1.5">
                {!photo.is_cover ? (
                  <button
                    type="button"
                    disabled={photoActionId === photo.id}
                    onClick={() => onSetCover(photo)}
                    className="text-[11px] font-medium text-accent hover:underline cursor-pointer disabled:opacity-50"
                  >
                    Set as cover
                  </button>
                ) : (
                  <span className="text-[11px] text-muted">Primary photo</span>
                )}
                <button
                  type="button"
                  disabled={photoActionId === photo.id}
                  onClick={() => onDelete(photo)}
                  className="rounded p-1 text-muted hover:bg-danger-bg hover:text-danger-fg cursor-pointer disabled:opacity-50"
                  title="Delete photo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
