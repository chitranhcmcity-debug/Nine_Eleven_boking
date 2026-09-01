<?php

namespace App\Http\Controllers;

use App\Models\Barber;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\Service;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BookingController extends Controller
{
    public function create() { return view('booking', ['services' => Service::where('active', true)->get(), 'barbers' => Barber::where('active', true)->get()]); }

    public function slots(Request $request) {
        $data = $request->validate(['date' => ['required','date','after_or_equal:today'], 'service_id' => ['required','exists:services,id'], 'barber_id' => ['required','exists:barbers,id']]);
        $service = Service::findOrFail($data['service_id']);
        $date = Carbon::parse($data['date']); $slots = [];
        for ($time = $date->copy()->setTime(9, 0); $time->lt($date->copy()->setTime(20, 0)); $time->addMinutes(30)) {
            $end = $time->copy()->addMinutes($service->duration);
            if ($end->gt($date->copy()->setTime(20, 0)) || $time->isPast()) continue;
            $busy = Booking::where('barber_id', $data['barber_id'])->whereNotIn('status', ['cancelled','no_show'])
                ->where('starts_at', '<', $end)->where('ends_at', '>', $time)->exists();
            if (!$busy) $slots[] = ['value' => $time->format('Y-m-d H:i:s'), 'label' => $time->format('H:i')];
        }
        return response()->json($slots);
    }

    public function store(Request $request) {
        $data = $request->validate([
            'name' => ['required','string','max:100'], 'phone' => ['required','regex:/^[0-9+ ]{9,15}$/'],
            'email' => ['nullable','email'], 'service_id' => ['required','exists:services,id'],
            'barber_id' => ['required','exists:barbers,id'], 'starts_at' => ['required','date','after:now'], 'notes' => ['nullable','string','max:500'],
        ]);
        $booking = DB::transaction(function () use ($data) {
            $service = Service::findOrFail($data['service_id']); $start = Carbon::parse($data['starts_at']); $end = $start->copy()->addMinutes($service->duration);
            $conflict = Booking::where('barber_id', $data['barber_id'])->whereNotIn('status', ['cancelled','no_show'])
                ->where('starts_at', '<', $end)->where('ends_at', '>', $start)->lockForUpdate()->exists();
            abort_if($conflict, 422, 'Khung giờ này vừa được người khác đặt. Vui lòng chọn giờ khác.');
            $customer = Customer::updateOrCreate(['phone' => preg_replace('/\s+/', '', $data['phone'])], ['name' => $data['name'], 'email' => $data['email'] ?? null]);
            return Booking::create(['code' => 'NE-'.strtoupper(Str::random(6)), 'customer_id' => $customer->id, 'service_id' => $service->id,
                'barber_id' => $data['barber_id'], 'starts_at' => $start, 'ends_at' => $end, 'notes' => $data['notes'] ?? null, 'total' => $service->price]);
        });
        return redirect()->route('booking.success', $booking);
    }

    public function success(Booking $booking) { return view('booking-success', compact('booking')); }
}
