<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\Room;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_login_with_valid_credentials(): void
    {
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'admin@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'token',
                'user' => ['id', 'name', 'email', 'role'],
            ])
            ->assertJson([
                'user' => [
                    'email' => 'admin@example.com',
                    'role' => 'admin',
                ],
            ]);
    }

    public function test_active_tenant_can_login_with_valid_credentials(): void
    {
        $property = Property::create([
            'name' => 'Makati Suites',
            'city' => 'Makati',
            'address' => 'Ayala Ave',
        ]);

        $room = Room::create([
            'property_id' => $property->id,
            'room_number' => '101',
            'rent' => 12000.00,
            'status' => 'occupied',
        ]);

        $user = User::create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'tenant',
        ]);

        $tenant = Tenant::create([
            'user_id' => $user->id,
            'property_id' => $property->id,
            'room' => '101',
            'username' => 'johndoe',
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'phone' => '09123456789',
            'password' => Hash::make('secret123'),
            'status' => 'active',
            'balance' => 0.00,
            'water_rate' => 500.00,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'john@example.com',
            'password' => 'secret123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'token',
                'user' => ['id', 'name', 'email', 'role', 'tenant'],
            ])
            ->assertJson([
                'user' => [
                    'email' => 'john@example.com',
                    'role' => 'tenant',
                    'tenant' => [
                        'room' => '101',
                        'status' => 'active',
                    ],
                ],
            ]);
    }

    public function test_pending_tenant_cannot_login(): void
    {
        $property = Property::create([
            'name' => 'Makati Suites',
            'city' => 'Makati',
            'address' => 'Ayala Ave',
        ]);

        $user = User::create([
            'name' => 'Pending Applicant',
            'email' => 'pending@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'tenant',
        ]);

        Tenant::create([
            'user_id' => $user->id,
            'property_id' => $property->id,
            'room' => '102',
            'username' => 'pendingapp',
            'name' => 'Pending Applicant',
            'email' => 'pending@example.com',
            'phone' => '09123456789',
            'password' => Hash::make('secret123'),
            'status' => 'pending_approval',
            'balance' => 0.00,
            'water_rate' => 500.00,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'pending@example.com',
            'password' => 'secret123',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Your account is pending landlord approval.',
            ]);
    }

    public function test_invalid_credentials_are_rejected(): void
    {
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'admin@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Invalid credentials.',
            ]);
    }

    public function test_tenant_registration_creates_pending_account_and_reserves_room(): void
    {
        $property = Property::create([
            'name' => 'Makati Suites',
            'city' => 'Makati',
            'address' => 'Ayala Ave',
        ]);

        $room = Room::create([
            'property_id' => $property->id,
            'room_number' => '103',
            'rent' => 11000.00,
            'status' => 'vacant',
        ]);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Jane Smith',
            'email' => 'jane@example.com',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
            'property_id' => $property->id,
            'room_number' => '103',
            'phone' => '09187654321',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Registration submitted. Awaiting approval.',
                'tenant' => [
                    'name' => 'Jane Smith',
                    'email' => 'jane@example.com',
                    'status' => 'pending_approval',
                    'room' => '103',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'jane@example.com',
            'role' => 'tenant',
        ]);

        $this->assertDatabaseHas('tenants', [
            'email' => 'jane@example.com',
            'status' => 'pending_approval',
        ]);

        $this->assertEquals('reserved', $room->fresh()->status);
    }

    public function test_tenant_registration_fails_if_room_already_occupied(): void
    {
        $property = Property::create([
            'name' => 'Makati Suites',
            'city' => 'Makati',
            'address' => 'Ayala Ave',
        ]);

        Room::create([
            'property_id' => $property->id,
            'room_number' => '104',
            'rent' => 11000.00,
            'status' => 'occupied',
        ]);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Another Applicant',
            'email' => 'applicant@example.com',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
            'property_id' => $property->id,
            'room_number' => '104',
            'phone' => '09187654321',
        ]);


        $response->assertStatus(409)
            ->assertJson([
                'message' => 'Selected room is already reserved or occupied.',
            ]);
    }
}
