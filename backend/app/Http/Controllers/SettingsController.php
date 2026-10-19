<?php

namespace App\Http\Controllers;

use App\Http\Requests\Settings\UpdateSettingsRequest;
use App\Http\Resources\SettingsResource;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;

class SettingsController extends Controller
{
    public function __construct(
        protected SettingsService $settingsService
    ) {}

    /**
     * Get global settings (utility rates and Landlord GCash details).
     */
    public function index(): JsonResponse
    {
        $setting = $this->settingsService->getSettings();

        return response()->json([
            'data' => new SettingsResource($setting),
        ]);
    }

    /**
     * Update global utility rates or GCash details. Admin only.
     */
    public function update(UpdateSettingsRequest $request): JsonResponse
    {
        $setting = $this->settingsService->updateSettings(
            $request->validated(),
            $request->file('gcash_qr')
        );

        return response()->json([
            'message' => 'Settings updated successfully.',
            'data' => new SettingsResource($setting),
        ]);
    }
}
