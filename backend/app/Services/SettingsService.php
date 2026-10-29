<?php

namespace App\Services;

use App\Models\Setting;
use App\Repositories\Contracts\SettingsRepositoryInterface;
use App\Support\PrivateFile;
use Illuminate\Http\UploadedFile;

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
            PrivateFile::delete($current->gcash_qr_path);
            $data['gcash_qr_path'] = PrivateFile::store($qrFile, 'settings');
        }

        return $this->settingsRepo->update($data);
    }
}
