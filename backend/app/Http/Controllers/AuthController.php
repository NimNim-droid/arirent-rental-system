<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\Room;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Authenticate user and issue Sanctum token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials.',
            ], 401);
        }

        $tenant = null;

        // If user is a tenant, verify application status
        if ($user->role === 'tenant') {
            $tenant = Tenant::where('user_id', $user->id)
                ->orWhere('email', $user->email)
                ->first();

            if ($tenant && $tenant->status === 'pending_approval') {
                return response()->json([
                    'message' => 'Your account is pending landlord approval.',
                ], 403);
            }

            if ($tenant && $tenant->status === 'inactive') {
                return response()->json([
                    'message' => 'Your account has been deactivated.',
                ], 403);
            }
        }

        // Issue Sanctum plain text token
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'token' => $token,
            'user' => [
                'id' => (string) $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'tenant' => $tenant ? [
                    'id' => (string) $tenant->id,
                    'room' => $tenant->room,
                    'property_id' => (string) $tenant->property_id,
                    'status' => $tenant->status,
                    'balance' => (float) $tenant->balance,
                ] : null,
            ],
        ]);
    }

    /**
     * Register a new tenant applicant.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        // Check if the requested room is already reserved or occupied
        $room = Room::where('property_id', $request->property_id)
            ->where('room_number', $request->room_number)
            ->first();

        if ($room && in_array($room->status, ['occupied', 'reserved'])) {
            return response()->json([
                'message' => 'Selected room is already reserved or occupied.',
            ], 409);
        }

        // 1. Create User account
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'tenant',
        ]);

        // Generate username
        $cleanName = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $request->name));
        $username = $cleanName . rand(100, 999);

        // 2. Create Tenant profile
        $tenant = Tenant::create([
            'user_id' => $user->id,
            'property_id' => $request->property_id,
            'room' => $request->room_number,
            'username' => $username,
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'status' => 'pending_approval',
            'balance' => 0.00,
            'water_rate' => 500.00,
        ]);

        // 3. Reserve room if room exists
        if ($room) {
            $room->update(['status' => 'reserved']);
        }

        return response()->json([
            'message' => 'Registration submitted. Awaiting approval.',
            'tenant' => [
                'id' => (string) $tenant->id,
                'name' => $tenant->name,
                'email' => $tenant->email,
                'status' => $tenant->status,
                'property_id' => (string) $tenant->property_id,
                'room' => $tenant->room,
            ],
        ], 201);
    }

    /**
     * Get authenticated user profile.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenant = Tenant::where('user_id', $user->id)
            ->orWhere('email', $user->email)
            ->with('property')
            ->first();

        return response()->json([
            'data' => [
                'id' => (string) $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'tenant' => $tenant ? [
                    'id' => (string) $tenant->id,
                    'room' => $tenant->room,
                    'property_id' => (string) $tenant->property_id,
                    'property_name' => $tenant->property?->name,
                    'status' => $tenant->status,
                    'balance' => (float) $tenant->balance,
                    'water_rate' => (float) $tenant->water_rate,
                    'lease_end' => $tenant->lease_end,
                ] : null,
            ],
        ]);
    }

    /**
     * Log the user out (revoke current token).
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }
}
