<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

class AuthController extends Controller
{
    public function __construct(
        protected AuthService $authService
    ) {}

    /**
     * Authenticate user and issue Sanctum token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $result = $this->authService->login($request->email, $request->password);

            return response()->json([
                'message' => 'Login successful.',
                'token' => $result['token'],
                'user' => $result['user'],
            ]);
        } catch (HttpException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], $e->getStatusCode());
        }
    }

    /**
     * Register a new tenant applicant.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        try {
            $tenant = $this->authService->register($request->validated());

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
        } catch (HttpException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], $e->getStatusCode());
        }
    }

    /**
     * Get authenticated user profile.
     */
    public function me(Request $request): JsonResponse
    {
        $profile = $this->authService->getProfile($request->user());

        return response()->json([
            'data' => $profile,
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
