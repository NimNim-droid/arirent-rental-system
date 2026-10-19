<?php

namespace App\Http\Controllers;

use App\Http\Requests\Settings\UpdateSettingsRequest;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    /**
     * Get global settings (utility rates and Landlord GCash details).
     */
    public function index(): JsonResponse
    {
        $setting = Setting::getGlobal();

        return response()->json([
            'data' => [
                'id' => (string) $setting->id,
                'elec_rate' => (float) $setting->elec_rate,
                'water_rate' => (float) $setting->water_rate,
                'gcash_name' => $setting->gcash_name,
                'gcash_number' => $setting->gcash_number,
                'gcash_qr_path' => $setting->gcash_qr_path,
            ],
        ]);
    }

    /**
     * Update global utility rates or GCash details. Admin only.
     */
    public function update(UpdateSettingsRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $setting = Setting::first();

        if (! $setting) {
            $setting = new Setting();
        }

        if ($request->hasFile('gcash_qr')) {
            // Delete old QR from storage if it exists
            if ($setting->gcash_qr_path && str_starts_with($setting->gcash_qr_path, '/storage/')) {
                $oldPath = str_replace('/storage/', '', $setting->gcash_qr_path);
                \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('gcash_qr')->store('settings', 'public');
            $setting->gcash_qr_path = '/storage/' . $path;
        }

        if (isset($validated['elec_rate'])) {
            $setting->elec_rate = $validated['elec_rate'];
        }

        if (isset($validated['water_rate'])) {
            $setting->water_rate = $validated['water_rate'];
        }

        if (isset($validated['gcash_name'])) {
            $setting->gcash_name = $validated['gcash_name'];
        }

        if (isset($validated['gcash_number'])) {
            $setting->gcash_number = $validated['gcash_number'];
        }

        $setting->save();

        return response()->json([
            'message' => 'Settings updated successfully.',
            'data' => [
                'id' => (string) $setting->id,
                'elec_rate' => (float) $setting->elec_rate,
                'water_rate' => (float) $setting->water_rate,
                'gcash_name' => $setting->gcash_name,
                'gcash_number' => $setting->gcash_number,
                'gcash_qr_path' => $setting->gcash_qr_path,
            ],
        ]);
    }
}
