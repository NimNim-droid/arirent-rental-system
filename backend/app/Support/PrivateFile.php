<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class PrivateFile
{
    public const DISK = 'local';

    private const DB_KEY_PREFIX = 'arirent_storage:file:';

    private const DB_EXPIRATION = 2147483647;

    /**
     * Store an upload on the private disk and return its relative path.
     */
    public static function store(UploadedFile $file, string $directory): string
    {
        $path = $file->store($directory, self::DISK);
        $contents = Storage::disk(self::DISK)->get($path);

        if ($contents !== null) {
            self::backupBytes($path, $contents);
        }

        return $path;
    }

    /**
     * Persist raw file bytes into the database cache table as an ephemeral-disk backup.
     */
    public static function backupBytes(string $path, string $contents): void
    {
        try {
            DB::table('cache')->updateOrInsert(
                ['key' => self::DB_KEY_PREFIX.$path],
                [
                    'value' => base64_encode($contents),
                    'expiration' => self::DB_EXPIRATION,
                ]
            );
        } catch (Throwable) {
            // Keep upload working even if cache table is unavailable in minimal test contexts.
        }
    }

    /**
     * Convert a stored path or legacy `/storage/...` URL into a relative path.
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

        if (str_starts_with($value, '/storage/')) {
            $value = substr($value, strlen('/storage/'));
        } elseif (preg_match('#^https?://#i', $value)) {
            $urlPath = parse_url($value, PHP_URL_PATH);

            if (! is_string($urlPath) || ! str_starts_with($urlPath, '/storage/')) {
                return null;
            }

            $value = substr($urlPath, strlen('/storage/'));
        }

        $value = ltrim($value, '/');

        if ($value === '' || str_contains($value, '..')) {
            return null;
        }

        return $value;
    }

    /**
     * Build a short-lived signed URL for a private file.
     */
    public static function url(?string $value, int $minutes = 15): ?string
    {
        $path = self::path($value);

        if ($path === null) {
            // Preserve explicitly external URLs (for example a remote QR image).
            if (is_string($value) && preg_match('#^https?://#i', $value)) {
                return $value;
            }

            return null;
        }

        return URL::temporarySignedRoute(
            'files.show',
            now()->addMinutes($minutes),
            ['path' => $path]
        );
    }

    /**
     * Delete a private file, including files left on the legacy public disk.
     */
    public static function delete(?string $value): void
    {
        $path = self::path($value);

        if ($path === null) {
            return;
        }

        if (Storage::disk(self::DISK)->exists($path)) {
            Storage::disk(self::DISK)->delete($path);
        }

        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }

        try {
            DB::table('cache')->where('key', self::DB_KEY_PREFIX.$path)->delete();
        } catch (Throwable) {
            // Ignore when DB backup entry or table is absent.
        }
    }

    /**
     * Serve a private file. Legacy files on the public disk still resolve.
     */
    public static function response(string $path): StreamedResponse
    {
        abort_if(str_contains($path, '..'), 404);

        $disk = Storage::disk(self::DISK);

        if (! $disk->exists($path)) {
            $publicDisk = Storage::disk('public');

            if ($publicDisk->exists($path)) {
                $disk = $publicDisk;
            } elseif (! self::restoreFromDatabase($path, $disk) && str_starts_with($path, 'documents/')) {
                $bundled = base_path('resources/documents/'.basename($path));

                if (is_file($bundled)) {
                    $bytes = @file_get_contents($bundled);
                    if ($bytes !== false) {
                        $disk->put($path, $bytes);
                    }
                }
            }
        }

        abort_unless($disk->exists($path), 404);

        $mimeType = $disk->mimeType($path) ?: 'application/octet-stream';
        $disposition = str_starts_with($mimeType, 'image/') ? 'inline' : 'attachment';

        return $disk->response($path, basename($path), [
            'Content-Type' => $mimeType,
            'X-Content-Type-Options' => 'nosniff',
            'Content-Security-Policy' => "default-src 'none'; sandbox",
            'Cache-Control' => 'private, max-age=60',
        ], $disposition);
    }

    /**
     * Restore a file from the database backup onto the local disk if available.
     */
    private static function restoreFromDatabase(string $path, \Illuminate\Contracts\Filesystem\Filesystem $disk): bool
    {
        try {
            $encoded = DB::table('cache')->where('key', self::DB_KEY_PREFIX.$path)->value('value');

            if (is_string($encoded) && $encoded !== '') {
                $decoded = base64_decode($encoded, true);

                if ($decoded !== false) {
                    $disk->put($path, $decoded);

                    return true;
                }
            }
        } catch (Throwable) {
            // Fall through if backup cannot be read.
        }

        return false;
    }
}
