<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Customer;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function dashboard() {
        $today = Booking::with(['customer','service','barber'])->whereDate('starts_at', today())->orderBy('starts_at')->get();
        return view('admin.dashboard', [
            'today' => $today, 'todayCount' => $today->count(), 'pending' => Booking::where('status','pending')->count(),
            'customers' => Customer::count(), 'revenue' => Booking::where('status','completed')->whereMonth('starts_at', now()->month)->sum('total'),
        ]);
    }
    public function bookings(Request $request) {
        $bookings = Booking::with(['customer','service','barber'])->when($request->status, fn($q,$s) => $q->where('status',$s))->latest('starts_at')->paginate(20)->withQueryString();
        return view('admin.bookings', compact('bookings'));
    }
    public function update(Request $request, Booking $booking) {
        $data = $request->validate(['status' => ['required','in:pending,confirmed,serving,completed,cancelled,no_show']]);
        $booking->update($data); if ($data['status'] === 'completed') $booking->customer->update(['last_visit_at' => now()]);
        return back()->with('success', 'Đã cập nhật lịch hẹn '.$booking->code);
    }
    public function customers() {
        $customers = Customer::withCount('bookings')->latest()->paginate(20); return view('admin.customers', compact('customers'));
    }
}
