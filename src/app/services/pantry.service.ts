import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase/firebase.service';

@Injectable({
  providedIn: 'root',
})
export class PantryService {
  constructor(private fs: FirebaseService) {}

}
