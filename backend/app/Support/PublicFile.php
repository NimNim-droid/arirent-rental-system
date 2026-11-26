<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class PublicFile
{
    private const DB_KEY_PREFIX = 'arirent_storage:listing_photo:';

    private const DB_EXPIRATION = 2147483647;

    /**
     * Disk used for public listing photos. Defaults to `public` locally;
     * set `LISTING_PHOTO_DISK=s3` in cloud environments with S3 storage.
     * When using local/public disk on ephemeral hosts (e.g. Render), files
     * are mirrored into the database cache table so they survive restarts.
     */
    public static function diskName(): string
    {
        return (string) env('LISTING_PHOTO_DISK', 'public');
    }

    /**
     * Store an uploaded listing photo and return its relative path.
     */
    public static function store(UploadedFile $file, string $directory = 'listing_photos'): string
    {
        $diskName = self::diskName();
        $path = $file->store($directory, $diskName);

        if ($diskName !== 's3') {
            try {
                $contents = Storage::disk($diskName)->get($path);

                if ($contents !== null) {
                    DB::table('cache')->updateOrInsert(
                        ['key' => self::DB_KEY_PREFIX . $path],
                        [
                            'value' => base64_encode($contents),
                            'expiration' => self::DB_EXPIRATION,
                        ]
                    );
                }
            } catch (Throwable) {
                // Keep upload working even if cache table is absent in minimal test contexts.
            }
        }

        return $path;
    }

    /**
     * Normalize a stored path, rejecting traversal sequences.
     */
    public static function path(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim($value);

        if ($value === '' || $value === '#') {
            return null;
        }

        if (preg_match('#^https?://#i', $value)) {
            return null;
        }

        if (str_starts_with($value, '/storage/')) {
            $value = substr($value, strlen('/storage/'));
        }

        $value = ltrim($value, '/');

        if ($value === '' || str_contains($value, '..')) {
            return null;
        }

        return $value;
    }

    /**
     * Resolve a public URL for a listing photo. External HTTPS URLs and S3
     * disks return direct URLs; local disks route through `public.media`.
     */
    public static function url(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $trimmed = trim($value);
        if ($trimmed === '') {
            return null;
        }

        if (preg_match('#^https?://#i', $trimmed)) {
            return $trimmed;
        }

        $path = self::path($trimmed);
        if ($path === null) {
            return null;
        }

        $diskName = self::diskName();
        if ($diskName === 's3') {
            return Storage::disk('s3')->url($path);
        }

        return URL::route('public.media', ['path' => $path]);
    }

    /**
     * Delete a stored listing photo and its database backup entry.
     */
    public static function delete(?string $value): void
    {
        $path = self::path($value);
        if ($path === null) {
            return;
        }

        $disk = Storage::disk(self::diskName());
        if ($disk->exists($path)) {
            $disk->delete($path);
        }

        try {
            DB::table('cache')->where('key', self::DB_KEY_PREFIX . $path)->delete();
        } catch (Throwable) {
            // Ignore when DB backup entry or table is absent.
        }
    }

    /**
     * Stream a public listing image, restoring from DB backup if ephemeral disk reset.
     */
    public static function response(string $path): StreamedResponse
    {
        abort_if($path === '' || str_contains($path, '..'), 404);

        $disk = Storage::disk(self::diskName());
        if (! $disk->exists($path) && self::diskName() !== 'public') {
            $publicDisk = Storage::disk('public');
            if ($publicDisk->exists($path)) {
                $disk = $publicDisk;
            }
        }

        if (! $disk->exists($path)) {
            try {
                $encoded = DB::table('cache')
                    ->where('key', self::DB_KEY_PREFIX . $path)
                    ->value('value');

                if (is_string($encoded) && $encoded !== '') {
                    $decoded = base64_decode($encoded, true);
                    if ($decoded !== false) {
                        $disk->put($path, $decoded);
                    }
                }
            } catch (Throwable) {
                // Fall through to 404 below if backup cannot be restored.
            }
        }

        abort_unless($disk->exists($path), 404);

        $mimeType = $disk->mimeType($path) ?: 'image/jpeg';

        return $disk->response($path, basename($path), [
            'Content-Type' => $mimeType,
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'public, max-age=86400',
        ], 'inline');
    }
}
