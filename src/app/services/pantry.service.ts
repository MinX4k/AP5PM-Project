import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase/firebase.service';

@Injectable({ providedIn: 'root' })
export class PantryService {
  constructor(private fs: FirebaseService) {}

  watchPantry(callback: (items: any[]) => void) {
    return this.fs.onCollectionRealtime(this.fs.pantryCollection(), callback);
  }

  async addPantryItem(productId: string, amount: number, unit: string, productName?: string) {
  return this.fs.addPantryItem({
    productId,
    amount,
    unit,
    productName: productName ?? null,
    addedAt: new Date()
  });
}

  async updatePantryAmount(itemId: string, newAmount: number) {
    return this.fs.updateDoc('pantry', itemId, { amount: newAmount });
  }

  async removePantryItem(itemId: string) {
    return this.fs.deleteDoc('pantry', itemId);
  }
}
