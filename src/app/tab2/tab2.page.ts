import { Component, OnDestroy, OnInit } from '@angular/core';
import { PantryService } from '../services/pantry.service';
import { FirebaseService } from '../services/firebase/firebase.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false
})
export class Tab2Page implements OnInit, OnDestroy {
  pantryItems: any[] = [];
  private unsub: any;

  constructor(private pantry: PantryService, private fs: FirebaseService) {}

  ngOnInit() {
    this.unsub = this.pantry.watchPantry(async (items) => {
      const withProduct = await Promise.all(items.map(async it => {
        try {
          if (!it.productId) {
            return { ...it, productName: it.productName ?? 'Unknown', productLoadError: false };
          }
          const p = await this.fs.getProductById(it.productId);
          if (p) {
            return {
              ...it,
              productName: p.name ?? it.productName ?? 'Unknown',
              unit: p.unit ?? it.unit ?? '',
              productLoadError: false
            };
          } else {
            return { ...it, productName: it.productName ?? 'Unknown', productLoadError: true };
          }
        } catch (e) {
          console.error('Chyba při načítání produktu', it, e);
          return { ...it, productName: it.productName ?? 'Unknown', productLoadError: true };
        }
      }));
      this.pantryItems = withProduct;
    });
  }

  ngOnDestroy() {
    if (this.unsub) this.unsub();
  }

  increase(item: any) {
    const newAmount = (item.amount || 0) + 1;
    this.pantry.updatePantryAmount(item.id, newAmount);
  }

  decrease(item: any) {
    const newAmount = Math.max(0, (item.amount || 0) - 1);
    this.pantry.updatePantryAmount(item.id, newAmount);
  }

  remove(item: any) {
    this.pantry.removePantryItem(item.id);
  }
}
