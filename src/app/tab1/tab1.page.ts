import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { FirebaseService } from '../services/firebase/firebase.service';


interface Ingredient {
  name: string;
  amount: number | null;
  unit?: string;
}


@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false
})
export class Tab1Page implements OnInit, OnDestroy {
  recipes: any[] = [];
  private unsub: any;

  showAdd = false;
  newRecipeName = '';
  newRecipeDescription = '';
  ingredientName = '';
  ingredientAmount: number | null = null;
  ingredientUnit = '';
  ingredients: Ingredient[] = [];

  saving = false;

  constructor(private fs: FirebaseService,
              private alertCtrl: AlertController,
              private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.unsub = this.fs.onCollectionRealtime(this.fs.recipesCollection(), (docs) => {
      this.recipes = docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    });
  }

  ngOnDestroy() {
    if (this.unsub) this.unsub();
  }

  openAdd() {
    this.resetAddForm();
    this.showAdd = true;
  }

  closeAdd() {
    this.showAdd = false;
  }

  resetAddForm() {
    this.newRecipeName = '';
    this.newRecipeDescription = '';
    this.ingredientName = '';
    this.ingredientAmount = null;
    this.ingredientUnit = '';
    this.ingredients = [];
  }

  addIngredientToList() {
    const name = (this.ingredientName || '').trim();
    if (!name) {
      this.showToast('Zadej název ingredience');
      return;
    }
    const amount = this.ingredientAmount !== null ? Number(this.ingredientAmount) : null;
    this.ingredients.push({
      name,
      amount,
      unit: (this.ingredientUnit || '').trim()
    });
    this.ingredientName = '';
    this.ingredientAmount = null;
    this.ingredientUnit = '';
  }

  removeIngredient(index: number) {
    this.ingredients.splice(index, 1);
  }

  async saveRecipe() {
    const name = (this.newRecipeName || '').trim();
    if (!name) {
      this.showToast('Název receptu je povinný');
      return;
    }
    if (!this.ingredients.length) {
      this.showToast('Přidej alespoň jednu ingredienci');
      return;
    }

    this.saving = true;
    try {
      const payload: any = {
        name,
        description: (this.newRecipeDescription || '').trim(),
        ingredients: this.ingredients.map(i => ({
          name: i.name,
          amount: i.amount,
          unit: i.unit || ''
        })),
        createdAt: new Date()
      };

      const docRef: any = await this.fs.addRecipe(payload);
      this.saving = false;
      await this.showToast('Recept uložen');
      this.closeAdd();
    } catch (e) {
      console.error('Chyba ukládání receptu', e);
      this.saving = false;
      await this.showToast('Chyba při ukládání receptu');
    }
  }

  async deleteRecipe(recipe: any) {
    if (!recipe?.id) return;
    try {
      await this.fs.deleteDoc('recipes', recipe.id);
      await this.showToast('Recept smazán');
    } catch (e) {
      console.error('Chyba při mazání receptu', e);
      await this.showToast('Chyba při mazání');
    }
  }

  private async showToast(msg: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 1500 });
    await t.present();
  }
}
