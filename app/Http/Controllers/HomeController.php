<?php

namespace App\Http\Controllers;

use App\Models\Barber;
use App\Models\Service;

class HomeController extends Controller
{
    public function __invoke() {
        return view('home', ['services' => Service::where('active', true)->get(), 'barbers' => Barber::where('active', true)->get()]);
    }
}
