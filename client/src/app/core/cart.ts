import { Injectable, computed, signal } from '@angular/core';
import { Product } from './models';

export interface CartLine {
  product: Pick<Product, 'id' | 'slug' | 'name' | 'price' | 'image' | 'stock'>;
  quantity: number;
}

const STORAGE_KEY = 'ne_cart';
const MAX_QUANTITY = 20;
export const SHIPPING_FEE = 30_000;
export const FREE_SHIPPING_FROM = 1_000_000;

function load(): CartLine[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

@Injectable({ providedIn: 'root' })
export class Cart {
  readonly lines = signal<CartLine[]>(load());
  readonly count = computed(() => this.lines().reduce((sum, line) => sum + line.quantity, 0));
  readonly subtotal = computed(() => this.lines().reduce((sum, line) => sum + line.product.price * line.quantity, 0));
  readonly shipping = computed(() =>
    this.subtotal() >= FREE_SHIPPING_FROM || this.lines().length === 0 ? 0 : SHIPPING_FEE,
  );

  add(product: Product, quantity: number): void {
    const existing = this.lines().find((line) => line.product.id === product.id);
    const next = Math.min(MAX_QUANTITY, product.stock, (existing?.quantity ?? 0) + quantity);
    const snapshot = {
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.image,
      stock: product.stock,
    };
    this.save(
      existing
        ? this.lines().map((line) => (line === existing ? { ...line, quantity: next } : line))
        : [...this.lines(), { product: snapshot, quantity: next }],
    );
  }

  setQuantity(productId: string, quantity: number): void {
    const clamped = Math.max(1, Math.min(MAX_QUANTITY, Math.floor(quantity) || 1));
    this.save(this.lines().map((line) => (line.product.id === productId ? { ...line, quantity: clamped } : line)));
  }

  remove(productId: string): void {
    this.save(this.lines().filter((line) => line.product.id !== productId));
  }

  clear(): void {
    this.save([]);
  }

  private save(lines: CartLine[]): void {
    this.lines.set(lines);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage unavailable: the cart lives in memory only */
    }
  }
}
