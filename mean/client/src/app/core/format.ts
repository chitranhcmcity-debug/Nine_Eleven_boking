import { Pipe, PipeTransform } from '@angular/core';

const vnd = new Intl.NumberFormat('vi-VN');

/** 1234567 -> "1.234.567" */
@Pipe({ name: 'vnd' })
export class VndPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return vnd.format(value ?? 0);
  }
}

/** Salon-local time zone for DatePipe. */
export const SALON_TZ = '+0700';

/** Message from an HttpErrorResponse produced by the API. */
export function apiMessage(error: unknown, fallback = 'Có lỗi xảy ra, vui lòng thử lại.'): string {
  const message = (error as { error?: { message?: string } })?.error?.message;
  return message ?? fallback;
}
