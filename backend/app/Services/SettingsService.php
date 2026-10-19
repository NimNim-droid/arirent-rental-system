<?php

namespace App\Services;

use App\Models\Setting;
use App\Repositories\Contracts\SettingsRepositoryInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class SettingsService
{
    public function __construct(
        protected SettingsRepositoryInterface $settingsRepo
    ) {}

    /**
     * Get global settings.
     */
    public function getSettings(): Setting
    {
        return $this->settingsRepo->getGlobal();
    }

    /**
     * Update global utility rates or GCash payment information.
     */
    public function updateSettings(array $data, ?UploadedFile $qrFile = null): Setting
    {
        $current = $this->settingsRepo->getGlobal();

        if ($qrFile) {
            if ($current->gcash_qr_path && str_starts_with($current->gcash_qr_path, '/storage/')) {
                $oldPath = str_replace('/storage/', '', $current->gcash_qr_path);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $qrFile->store('settings', 'public');
            $data['gcash_qr_path'] = '/storage/' . $path;
        }

        return $this->settingsRepo->update($data);
    }
}
