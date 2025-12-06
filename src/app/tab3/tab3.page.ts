import { Component } from '@angular/core';
import { FirebaseService } from '../services/firebase/firebase.service';
import { PantryService } from '../services/pantry.service';
import { ToastController } from '@ionic/angular';

import { Capacitor } from '@capacitor/core';
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false
})
export class Tab3Page {
  name = '';
  barcode = '';
  unit = 'ks';
  amount = 1;
  scanning = false;

  constructor(
    private fs: FirebaseService,
    private pantry: PantryService,
    private toast: ToastController
  ) {}

  async scan() {
  // kontrola platformy – skener funguje jen nativně
  if (!Capacitor.isNativePlatform()) {
    await this.presentToast('Skenování funguje pouze na nativním zařízení.');
    return;
  }

  try {
    this.scanning = true;

    const result: any = await CapacitorBarcodeScanner.scanBarcode({
      hint: CapacitorBarcodeScannerTypeHint.ALL
    });

    this.scanning = false;

    // různé verze pluginu můžou vracet různé property
    const code =
      result?.ScanResult ??
      result?.text ??
      result?.value ??
      result?.rawValue ??
      null;

    if (code) {
      this.barcode = code;
      await this.presentToast('Sken úspěšný: ' + this.barcode);
    } else {
      await this.presentToast('Sken zrušen nebo nic nenalezeno.');
    }
  } catch (err: any) {
    this.scanning = false;

    if ((err?.message ?? '').toLowerCase().includes('permission')) {
      await this.presentToast('Není povolena kamera. Povol ji v nastavení aplikace.');
    } else {
      await this.presentToast('Chyba při skenování.');
    }

    console.error('Scan error:', err);
  }
}

  async findByBarcode() {
    if (!this.barcode) { 
      await this.presentToast('Zadej nebo naskenuj čárový kód'); 
      return; 
    }

    const prods = await this.fs.getProductByBarcode(this.barcode);
    if (prods.length) {
      const p: any = prods[0];
      this.name = p.name || '';
      this.unit = p.unit || 'ks';
      await this.presentToast('Produkt nalezen: ' + this.name);
    } else {
      await this.presentToast('Produkt s tímto čárovým kódem nenalezen');
    }
  }

  async saveProduct() {
    if (!this.name) { await this.presentToast('Zadej název produktu'); return; }
    const docRef: any = await this.fs.addProduct({ name: this.name, barcode: this.barcode || null, unit: this.unit });
    await this.presentToast('Produkt uložen: ' + docRef.id);

    if (this.amount && Number(this.amount) > 0) {
      await this.pantry.addPantryItem(docRef.id, Number(this.amount), this.unit, this.name);
      await this.presentToast('Přidáno do spíže');
      this.name = ''; this.barcode = ''; this.amount = 1;
    }
  }

  private async presentToast(msg: string) {
    const t = await this.toast.create({ message: msg, duration: 2000 });
    await t.present();
  }
}
