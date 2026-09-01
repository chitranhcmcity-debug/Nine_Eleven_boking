@extends('layouts.app')
@section('title','Đặt lịch — NineEleven')
@section('content')
<section class="booking-page"><div class="booking-intro"><p class="eyebrow">BOOK YOUR CHAIR</p><h1>CHỌN GIỜ.<br><em>CHỌN CHẤT.</em></h1><p>Lịch trống được cập nhật tức thời. Chỉ mất khoảng 60 giây để giữ ghế của bạn.</p><div class="steps"><span class="active">01 Dịch vụ</span><span>02 Thời gian</span><span>03 Thông tin</span></div></div>
<form class="booking-form" method="post" action="{{ route('booking.store') }}">@csrf
@if($errors->any())<div class="alert">{{ $errors->first() }}</div>@endif
<div class="field"><label>01 · DỊCH VỤ</label><div class="service-options">@foreach($services as $service)<label class="option"><input type="radio" name="service_id" value="{{ $service->id }}" data-duration="{{ $service->duration }}" {{ old('service_id',request('service'))==$service->id?'checked':'' }} required><span><b>{{ $service->name }}</b><small>{{ $service->duration }} phút · {{ number_format($service->price) }}đ</small></span></label>@endforeach</div></div>
<div class="form-row"><div class="field"><label for="barber">02 · BARBER</label><select id="barber" name="barber_id" required><option value="">Chọn barber</option>@foreach($barbers as $barber)<option value="{{ $barber->id }}">{{ $barber->name }} — {{ $barber->title }}</option>@endforeach</select></div><div class="field"><label for="date">03 · NGÀY</label><input id="date" type="date" min="{{ today()->format('Y-m-d') }}" name="date" required></div></div>
<div class="field"><label>04 · GIỜ TRỐNG <span id="slot-status">— Chọn dịch vụ, barber và ngày</span></label><div id="slots" class="slots"></div><input type="hidden" name="starts_at" id="starts_at" required></div>
<div class="form-row"><div class="field"><label>05 · HỌ TÊN</label><input name="name" value="{{ old('name') }}" placeholder="Tên của bạn" required></div><div class="field"><label>SỐ ĐIỆN THOẠI</label><input name="phone" value="{{ old('phone') }}" placeholder="0909 119 911" required></div></div>
<div class="form-row"><div class="field"><label>EMAIL (KHÔNG BẮT BUỘC)</label><input type="email" name="email" value="{{ old('email') }}" placeholder="you@email.com"></div><div class="field"><label>GHI CHÚ</label><input name="notes" value="{{ old('notes') }}" placeholder="Kiểu tóc, yêu cầu đặc biệt..."></div></div>
<button class="btn full" type="submit">XÁC NHẬN ĐẶT LỊCH <span>↗</span></button><p class="form-note">Bằng việc đặt lịch, bạn đồng ý để NineEleven liên hệ xác nhận qua điện thoại.</p></form></section>
@endsection
@push('scripts')<script src="{{ asset('js/booking.js') }}"></script>@endpush
