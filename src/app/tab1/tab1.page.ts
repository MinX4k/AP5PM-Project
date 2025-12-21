import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { FirebaseService } from '../services/firebase/firebase.service';

interface Ingredient {
  name: string;
  amount: number | null;
  unit?: string;
  productId?: string;
  available?: boolean;
}

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false
})
export class Tab1Page implements OnInit, OnDestroy {
  recipes: any[] = [];
  pantryItems: any[] = [];
  private recipesUnsub: any;
  private pantryUnsub: any;

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
    this.recipesUnsub = this.fs.onCollectionRealtime(this.fs.recipesCollection(), (docs) => {
      this.recipes = docs.map(d => this.normalizeRecipe(d));
      this.updateAllRecipesAvailability();
    });

    this.pantryUnsub = this.fs.onCollectionRealtime(this.fs.pantryCollection(), (items) => {
      this.pantryItems = items;
      this.updateAllRecipesAvailability();
    });
  }

  ngOnDestroy() {
    if (this.recipesUnsub) this.recipesUnsub();
    if (this.pantryUnsub) this.pantryUnsub();
  }

  private normalizeRecipe(r: any) {
    const recipe = { ...r };
    recipe.ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
    recipe.ingredients = recipe.ingredients.map((ing: any) => ({
      name: (ing?.name ?? '').trim(),
      amount: ing?.amount ?? null,
      unit: ing?.unit ?? '',
      productId: ing?.productId ?? null
    }));
    return recipe;
  }

  private buildPantryIndex() {
    const byProductId = new Map<string, number>();
    const byName = new Map<string, number>();

    for (const p of this.pantryItems) {
      const amt = Number(p.amount ?? 0);
      if (p.productId) {
        const key = String(p.productId);
        byProductId.set(key, (byProductId.get(key) ?? 0) + (isNaN(amt) ? 0 : amt));
    }
      const name = (p.productName ?? p.name ?? '').toString().trim().toLowerCase();
      if (name) {
      byName.set(name, (byName.get(name) ?? 0) + (isNaN(amt) ? 0 : amt));
    }
    }
    return { byProductId, byName };
  }

  private updateAllRecipesAvailability() {
    if (!this.recipes) return;
    const idx = this.buildPantryIndex();

    this.recipes = this.recipes.map(recipe => {
      const ingredients = (recipe.ingredients || []).map((ing: Ingredient) => {
        const needed = Number(ing.amount ?? 0);
        const nameNorm = (ing.name || '').toString().trim().toLowerCase();
        const productId = ing.productId ? String(ing.productId) : null;

        const availableById = productId ? (idx.byProductId.get(productId) ?? 0) : null
        const availableByName = nameNorm ? (idx.byName.get(nameNorm) ?? 0) : null;

        let state: 'full' | 'partial' | 'none';
        const available = productId ? (availableById ?? 0) : (availableByName ?? 0);

        if (!needed || needed <= 0) {
        state = (available > 0) ? 'full' : 'none';
      } else {
        if (available >= needed && available > 0) state = 'full';
        else if (available > 0 && available < needed) state = 'partial';
        else state = 'none';
      }

        return { ...ing, availableState: state, availableAmount: available };
      });
      return { ...recipe, ingredients };
    });
  }

  getIngredientState(ing: Ingredient): 'full' | 'partial' | 'none' {
  return (ing as any).availableState ?? 'none';
}

  async deleteRecipe(recipe: any) {
    if (!recipe?.id) return;
    try {
      await this.fs.deleteDoc('recipes', recipe.id);
      this.showToast("Recept smazán.")
    } catch (e) {
      console.error(e);
      this.showToast('Chyba při mazání');
    }
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

  private async showToast(msg: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 1500, position: 'top'});
    await t.present();
  }
}
