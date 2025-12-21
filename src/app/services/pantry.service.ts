import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase/firebase.service';
import { getDocs, doc, addDoc, updateDoc } from 'firebase/firestore';


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

async mergeAddPantryItem(productName: string, amount: number, unit: string) {
  if (!productName || !productName.length) {
      throw new Error('Jméno produktu vyžadováno');
    }
    const qty = Number(amount ?? 0);
    if (isNaN(qty) || qty <= 0) {
      throw new Error('Neplatné množství');
    }

    const pantryColRef = this.fs.pantryCollection();
    const snap = await getDocs(pantryColRef);

    let existingDoc: any = null;
    for (const d of snap.docs) {
      const data = d.data();
      const n1 = data['name'];
      const n2 = data['productName'];
      if (n1 === productName || n2 === productName) {
        existingDoc = { id: d.id, data };
        break;
      }
    }
    if (existingDoc) {
      const existingAmount = Number(existingDoc.data['amount'] ?? 0);
      const newAmount = existingAmount + qty;
      await this.fs.updateDoc('pantry', existingDoc.id, {
        amount: newAmount,
        unit: unit || existingDoc.data['unit'] || '',
        updatedAt: new Date()
      });
      return { merged: true, id: existingDoc.id };
    }

    const docRef: any = await this.fs.addPantryItem({
      productId: null,
      amount: qty,
      unit: unit || '',
      name: productName,
      productName: productName,
      createdAt: new Date()
    });
    return { merged: false, id: docRef?.id ?? null };
  }



  async updatePantryAmount(itemId: string, newAmount: number) {
    return this.fs.updateDoc('pantry', itemId, { amount: newAmount });
  }

  async removePantryItem(itemId: string) {
    return this.fs.deleteDoc('pantry', itemId);
  }
}
