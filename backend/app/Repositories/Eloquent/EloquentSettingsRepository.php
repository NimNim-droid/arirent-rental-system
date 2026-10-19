<?php

namespace App\Repositories\Eloquent;

use App\Models\Setting;
use App\Repositories\Contracts\SettingsRepositoryInterface;

class EloquentSettingsRepository implements SettingsRepositoryInterface
{
    public function getGlobal(): Setting
    {
        return Setting::getGlobal();
    }

    public function update(array $attributes): Setting
    {
        $setting = Setting::first();
        if (! $setting) {
            $setting = new Setting();
        }

        $setting->fill($attributes);
        $setting->save();

        return $setting;
    }
}
