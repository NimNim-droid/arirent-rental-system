<?php

namespace Tests\Feature;

use App\Models\Bill;
use App\Models\Property;
use App\Models\Room;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SecurityHardeningTest extends TestCase
{
    use RefreshDatabase;

    private Property $property;

    private User $tenantUser;

    private Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->property = Property::create([
            'name' => 'Makati Suites',
            'city' => 'Makati',
            'address' => 'Ayala Ave',
        ]);

        Room::create([
            'property_id' => $this->property->id,
            'room_number' => '101',
            'rent' => 12000.00,
            'status' => 'occupied',
        ]);

        $this->tenantUser = User::create([
            'name' => 'Tenant Alice',
            'email' => 'alice@example.com',
            'password' => Hash::make('secret'),
            'role' => 'tenant',
        ]);

        $this->tenant = Tenant::create([
            'user_id' => $this->tenantUser->id,
            'property_id' => $this->property->id,
            'room' => '101',
            'username' => 'alice101',
            'name' => 'Tenant Alice',
            'email' => 'alice@example.com',
            'phone' => '09111111111',
            'password' => Hash::make('secret'),
            'status' => 'active',
            'balance' => 0.00,
            'water_rate' => 500.00,
        ]);
    }

    public function test_login_is_rate_limited_after_repeated_failures(): void
    {
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => Hash::make('correct-password'),
            'role' => 'admin',
        ]);

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/login', [
                'email' => 'admin@example.com',
                'password' => 'wrong-password',
            ])->assertStatus(401);
        }

        $this->postJson('/api/login', [
            'email' => 'admin@example.com',
            'password' => 'wrong-password',
        ])->assertStatus(429);
    }

    public function test_registration_is_rate_limited_per_ip(): void
    {
        for ($attempt = 0; $attempt < 3; $attempt++) {
            $this->postJson('/api/register', [])->assertStatus(422);
        }

        $this->postJson('/api/register', [])->assertStatus(429);
    }

    public function test_receipt_upload_rejects_svg_files(): void
    {
        $bill = Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 12000.00,
            'electricity' => 600.00,
            'water' => 500.00,
            'total_amount' => 13100.00,
            'date' => now()->format('Y-m-d'),
            'due_date' => now()->addDays(5)->format('Y-m-d'),
            'status' => 'unpaid',
        ]);

        Sanctum::actingAs($this->tenantUser);

        $response = $this->post(
            "/api/bills/{$bill->id}/pay",
            [
                'gcash_ref' => '1234567890',
                'receipt' => UploadedFile::fake()->create('receipt.svg', 10, 'image/svg+xml'),
            ],
            ['Accept' => 'application/json']
        );

        $response->assertStatus(422)
            ->assertJsonValidationErrors('receipt');
    }

    public function test_sanctum_tokens_have_a_finite_expiration(): void
    {
        $this->assertNotNull(config('sanctum.expiration'));
        $this->assertGreaterThan(0, (int) config('sanctum.expiration'));
    }

    public function test_admin_password_rotation_revokes_existing_tokens(): void
    {
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => Hash::make('old-password'),
            'role' => 'admin',
        ]);

        $admin->createToken('existing-session');

        $this->artisan('arirent:rotate-admin-password', [
            'email' => 'admin@example.com',
            '--password' => 'NewStrongPassword123!',
        ])->assertSuccessful();

        $this->assertTrue(Hash::check('NewStrongPassword123!', $admin->fresh()->password));
        $this->assertSame(0, $admin->tokens()->count());
    }

    public function test_seeding_does_not_create_known_default_credentials_or_demo_data(): void
    {
        $this->seed();

        $admin = User::where('email', env('SEED_ADMIN_EMAIL', 'admin@arirent.com'))->first();

        $this->assertNotNull($admin);
        $this->assertFalse(Hash::check('admin', $admin->password));
        $this->assertFalse(Hash::check('admin123', $admin->password));
        $this->assertDatabaseMissing('tenants', ['email' => 'tenant@arirent.com']);
        $this->assertDatabaseMissing('users', ['email' => 'tenant@arirent.com']);
    }
}
