<?php

namespace App\Http\Controllers;

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
        $setting = Setting::firstOrCreate([], [
            'elec_rate' => 12.50,
            'water_rate' => 500.00,
            'gcash_name' => 'AriRent Property Management',
            'gcash_number' => '0917-123-4567',
            'gcash_qr_path' => null,
        ]);

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
    public function update(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $validated = $request->validate([
            'elec_rate' => 'nullable|numeric|min:0',
            'water_rate' => 'nullable|numeric|min:0',
            'gcash_name' => 'nullable|string|max:255',
            'gcash_number' => 'nullable|string|max:50',
            'gcash_qr' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
        ]);

        $setting = Setting::first();

        if (! $setting) {
            $setting = new Setting();
        }

        if ($request->hasFile('gcash_qr')) {
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
