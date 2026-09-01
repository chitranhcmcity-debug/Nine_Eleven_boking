<?php

namespace Tests\Feature;

use App\Models\Barber;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_book_an_available_slot(): void
    {
        $service = Service::create(['name'=>'Cut','duration'=>45,'price'=>180000,'active'=>true]);
        $barber = Barber::create(['name'=>'Khoa','active'=>true]);
        $start = now()->addDays(2)->setTime(10, 0);
        $response = $this->post('/dat-lich', ['name'=>'Nam','phone'=>'0909119911','service_id'=>$service->id,'barber_id'=>$barber->id,'starts_at'=>$start->format('Y-m-d H:i:s')]);
        $response->assertRedirect();
        $this->assertDatabaseHas('bookings', ['barber_id'=>$barber->id,'total'=>180000]);
    }

    public function test_crm_requires_authentication(): void
    {
        $this->get('/admin')->assertRedirect('/admin/login');
        $user = User::factory()->create();
        $this->actingAs($user)->get('/admin')->assertOk();
    }
}
