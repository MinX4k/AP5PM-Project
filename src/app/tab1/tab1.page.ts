import { Component, OnDestroy, OnInit } from '@angular/core';
import { FirebaseService } from '../services/firebase/firebase.service';
@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements OnInit, OnDestroy {
  recipes: any[] = [];
  private unsub: any;

  constructor(private fs: FirebaseService) {}
}
