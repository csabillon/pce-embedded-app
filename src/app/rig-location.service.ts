import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Rig {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  additionalInfo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RigLocationService {
  // Static rig data with additional information.
  private rigs: Rig[] = [
    { 
      id: 'TODPS', 
      name: 'DS Magneto', 
      latitude: 25.5, 
      longitude: -90.5,
      additionalInfo: 'Operated by SLB. Deepwater drilling rig.'
    },
    { 
      id: 'TODTH', 
      name: 'DS Thanos', 
      latitude: 26.0, 
      longitude: -89.8,
      additionalInfo: 'Operated by SLB. Deepwater drilling rig.'
    },
    { 
      id: 'TODPT', 
      name: 'DS Doom', 
      latitude: 27.0, 
      longitude: -87.8,
      additionalInfo: 'Operated by SLB. Deepwater drilling rig.'
    },
    { 
      id: 'GULFA', 
      name: 'DS Galactus', 
      latitude: 26.5, 
      longitude: -90.0,
      additionalInfo: 'Operated by Archer. Platform drilling rig.'
    }
  ];

  getRigs(): Observable<Rig[]> {
    return of(this.rigs);
  }
}
