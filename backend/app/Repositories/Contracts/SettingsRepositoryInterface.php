<?php

namespace App\Repositories\Contracts;

use App\Models\Setting;

interface SettingsRepositoryInterface
{
    public function getGlobal(): Setting;

    public function update(array $attributes): Setting;
}
