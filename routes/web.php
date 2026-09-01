<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\HomeController;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');
Route::get('/dat-lich', [BookingController::class, 'create'])->name('booking.create');
Route::get('/api/slots', [BookingController::class, 'slots'])->name('booking.slots');
Route::post('/dat-lich', [BookingController::class, 'store'])->name('booking.store');
Route::get('/dat-lich/thanh-cong/{booking}', [BookingController::class, 'success'])->name('booking.success');

Route::get('/admin/login', [AuthController::class, 'show'])->name('login');
Route::post('/admin/login', [AuthController::class, 'login'])->name('login.submit');
Route::middleware('auth')->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [AdminController::class, 'dashboard'])->name('dashboard');
    Route::get('/lich-hen', [AdminController::class, 'bookings'])->name('bookings');
    Route::patch('/lich-hen/{booking}', [AdminController::class, 'update'])->name('bookings.update');
    Route::get('/khach-hang', [AdminController::class, 'customers'])->name('customers');
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
});
