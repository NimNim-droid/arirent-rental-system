<?php

namespace App\Console\Commands;

use App\Support\PrivateFile;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class MigratePublicFiles extends Command
{
    protected $signature = 'arirent:private-files {--dry-run : Report changes without moving files}';

    protected $description = 'Move legacy public uploads to private storage and rewrite stored paths';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $moved = 0;

        foreach (['receipts', 'meter_proofs', 'maintenance', 'documents', 'settings'] as $directory) {
            foreach (Storage::disk('public')->allFiles($directory) as $path) {
                $this->line(($dryRun ? '[dry-run] would move ' : 'Moving ').$path);

                if ($dryRun) {
                    $moved++;
                    continue;
                }

                $stream = Storage::disk('public')->readStream($path);

                if ($stream === false) {
                    $this->error("Unable to read {$path}.");

                    continue;
                }

                Storage::disk('local')->writeStream($path, $stream);

                if (is_resource($stream)) {
                    fclose($stream);
                }

                // Artisan may run as a different user than PHP-FPM. Keep the
                // private files readable by the web process without exposing
                // them through the public disk.
                $target = Storage::disk('local')->path($path);
                @chmod($target, 0644);
                @chmod(dirname($target), 0755);

                Storage::disk('public')->delete($path);
                $moved++;
            }
        }

        $rows = $this->rewriteDatabasePaths($dryRun);
        $documents = $this->rewriteDocumentIndex($dryRun);

        $this->info(
            ($dryRun ? '[dry-run] ' : '')
            ."Moved {$moved} file(s), updated {$rows} database row(s), updated {$documents} document(s)."
        );

        return self::SUCCESS;
    }

    private function rewriteDatabasePaths(bool $dryRun): int
    {
        $columns = [
            'bills' => 'receipt_url',
            'payments' => 'receipt_url',
            'utility_readings' => 'meter_photo_url',
            'maintenance_tickets' => 'photo_url',
            'settings' => 'gcash_qr_path',
        ];

        $updated = 0;

        foreach ($columns as $table => $column) {
            DB::table($table)
                ->whereNotNull($column)
                ->orderBy('id')
                ->chunkById(100, function ($records) use ($table, $column, $dryRun, &$updated) {
                    foreach ($records as $record) {
                        $old = $record->{$column};
                        $new = PrivateFile::path($old);

                        if ($new === null || $new === $old) {
                            continue;
                        }

                        $this->line("{$table}.{$column}: {$old} -> {$new}");

                        if (! $dryRun) {
                            DB::table($table)->where('id', $record->id)->update([$column => $new]);
                        }

                        $updated++;
                    }
                });
        }

        return $updated;
    }

    private function rewriteDocumentIndex(bool $dryRun): int
    {
        $disk = Storage::disk('local');

        if (! $disk->exists('documents.json')) {
            return 0;
        }

        $documents = json_decode($disk->get('documents.json'), true);

        if (! is_array($documents)) {
            return 0;
        }

        $updated = 0;

        foreach ($documents as &$document) {
            $path = PrivateFile::path($document['storage_path'] ?? null);

            if ($path === null) {
                continue;
            }

            $this->line("documents.json: {$document['name']} -> {$path}");

            if (! $dryRun) {
                $document['storage_path'] = $path;
                // URLs are generated as short-lived signed URLs when documents are listed.
                $document['url'] = null;
            }

            $updated++;
        }
        unset($document);

        if (! $dryRun) {
            $disk->put('documents.json', json_encode(array_values($documents), JSON_PRETTY_PRINT));
        }

        return $updated;
    }
}
