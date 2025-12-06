import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, query, where, getDocs, onSnapshot, QuerySnapshot, DocumentData, Firestore
} from 'firebase/firestore';
import { environment } from '../../../environments/environment';

export interface Product {
  id: string;
  name?: string;
  unit?: string;
  barcode?: string;
  [k: string]: any;
}

@Injectable({
  providedIn: 'root',
})

export class FirebaseService {
  
  private app: any;
  public db: Firestore;

  constructor() {
    this.app = initializeApp(environment.firebase);
    this.db = getFirestore(this.app);
  }
  productsCollection() { return collection(this.db, 'products'); }
  pantryCollection() { return collection(this.db, 'pantry'); }
  recipesCollection() { return collection(this.db, 'recipes'); }

  addProduct(data: any) { return addDoc(this.productsCollection(), data); }
  addPantryItem(data: any) { return addDoc(this.pantryCollection(), data); }
  addRecipe(data: any) { return addDoc(this.recipesCollection(), data); }

  updateDoc(collectionName: string, id: string, data: any) {
    return updateDoc(doc(this.db, collectionName, id), data);
  }
  deleteDoc(collectionName: string, id: string) {
    return deleteDoc(doc(this.db, collectionName, id));
  }

   async getProductById(productId: string) {
    const dref = doc(this.db, 'products', productId);
    const snap = await getDoc(dref);
    return snap.exists() ? { id: snap.id, ...(snap.data() as any) } : null;
  }

  async getProductByBarcode(barcode: string): Promise<Product[]> {
    const q = query(this.productsCollection(), where('barcode', '==', barcode));
    const snap = await getDocs(q);

    return snap.docs.map(d => {
      const data = d.data() as Product;
      return {
        ...data,
        id: d.id
      };
    });
  }

  onCollectionRealtime(collectionRef: any, cb: (items: any[]) => void) {
    return onSnapshot(collectionRef, (snap: any) => {
      cb(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
    });
  }
}
