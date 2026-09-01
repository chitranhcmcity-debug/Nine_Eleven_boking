@extends('layouts.app')
@section('title','Đặt lịch thành công — NineEleven')
@section('content')<section class="success-page"><div class="success-mark">✓</div><p class="eyebrow">YOUR CHAIR IS RESERVED</p><h1>HẸN GẶP BẠN<br>TẠI <em>NINEELEVEN.</em></h1><div class="ticket"><span>MÃ LỊCH HẸN</span><strong>{{ $booking->code }}</strong><p>{{ $booking->starts_at->format('H:i · d/m/Y') }}</p></div><p>Chúng tôi sẽ sớm liên hệ xác nhận. Vui lòng đến trước giờ hẹn 5 phút.</p><a href="{{ route('home') }}" class="btn">VỀ TRANG CHỦ ↗</a></section>@endsection
