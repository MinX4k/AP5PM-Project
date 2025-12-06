// src/app/services/barcode.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { FirebaseService } from './firebase/firebase.service';

export interface ProductLite {
  id?: string;
  name?: string;
  barcode?: string;
  unit?: string;
  extra?: any;
  source?: string;
}

@Injectable({ providedIn: 'root' })
export class BarcodeService {
  constructor(private http: HttpClient, private fs: FirebaseService) {}

  async findInLocal(barcode: string): Promise<ProductLite | null> {
    const res = await this.fs.getProductByBarcode(barcode);
    if (res && res.length) return { ...res[0], id: res[0].id } as ProductLite;
    return null;
  }

  async findInOpenFoodFacts(barcode: string): Promise<ProductLite | null> {
    try {
      const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}`;
      const r: any = await firstValueFrom(this.http.get(url));
      if (r?.status === 1 && r.product) {
        const p = {
          name: r.product.product_name || r.product.generic_name || r.product.brands || '',
          barcode,
          unit: 'ks',
          extra: {
            brands: r.product.brands,
            nutriments: r.product.nutriments,
            images: r.product.images
          },
          source: 'openfoodfacts'
        } as ProductLite;
        return p;
      }
    } catch (e) {
      console.warn('OFF lookup failed', e);
    }
    return null;
  }

  async findAndSave(barcode: string): Promise<ProductLite | null> {
    const local = await this.findInLocal(barcode);
    if (local) return local;

    const off = await this.findInOpenFoodFacts(barcode);
    if (off) {
      const docRef: any = await this.fs.addProduct({
        name: off.name,
        barcode: off.barcode,
        unit: off.unit,
        extra: off.extra,
        source: off.source,
        createdAt: new Date()
      });
      return { id: docRef.id, ...off };
    }

    return null;
  }
}
