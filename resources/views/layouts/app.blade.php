<!doctype html><html lang="vi"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="csrf-token" content="{{ csrf_token() }}"><title>@yield('title','NineEleven Barber')</title>
<meta name="description" content="NineEleven — tiệm tóc nam hiện đại. Đặt lịch nhanh, chọn barber và khung giờ theo thời gian thực.">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{{ asset('css/app.css') }}"></head><body>
<div class="announcement">NEW WEEK · NEW LOOK — ĐẶT LỊCH ONLINE, KHÔNG CẦN CHỜ</div>
<header class="nav"><a href="{{ route('home') }}" class="logo"><span>9</span>NINE<br>ELEVEN</a>
<button class="menu-toggle" aria-label="Mở menu">☰</button><nav><a href="{{ route('home') }}#services">DỊCH VỤ</a><a href="{{ route('home') }}#artists">BARBER</a><a href="{{ route('home') }}#story">CÂU CHUYỆN</a><a href="{{ route('home') }}#contact">LIÊN HỆ</a></nav>
<a href="{{ route('booking.create') }}" class="btn btn-small">ĐẶT LỊCH <span>↗</span></a></header>
<main>@yield('content')</main>
<footer id="contact"><div class="footer-logo">NINE<span>ELEVEN</span></div><div><p class="eyebrow">GHÉ TIỆM</p><p>91 Nguyễn Trãi, Quận 1, TP.HCM<br>09:00 — 20:00 · Thứ 2 — Chủ nhật</p></div><div><p class="eyebrow">KẾT NỐI</p><p>0909 119 911<br>hello@nineeleven.vn</p></div><a class="circle-link" href="{{ route('booking.create') }}">BOOK<br>NOW ↗</a></footer>
<script src="{{ asset('js/app.js') }}"></script>@stack('scripts')</body></html>
