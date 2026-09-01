<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function show() { return view('admin.login'); }
    public function login(Request $request) {
        $credentials = $request->validate(['email' => ['required','email'], 'password' => ['required']]);
        if (Auth::attempt($credentials, $request->boolean('remember'))) { $request->session()->regenerate(); return redirect()->intended('/admin'); }
        return back()->withErrors(['email' => 'Thông tin đăng nhập không đúng.'])->onlyInput('email');
    }
    public function logout(Request $request) { Auth::logout(); $request->session()->invalidate(); $request->session()->regenerateToken(); return redirect('/admin/login'); }
}
