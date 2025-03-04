import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  // Default rig key is 'TODPS'
  private rigSubject = new BehaviorSubject<string>('TODPS');
  rig$ = this.rigSubject.asObservable();

  selectRig(newRig: string): void {
    this.rigSubject.next(newRig);
  }
}
