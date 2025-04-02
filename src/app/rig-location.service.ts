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
      name: 'TransoceanDPS', 
      latitude: 25.5, 
      longitude: -90.5,
      additionalInfo: 'Operated by Transocean. Deepwater drilling rig.'
    },
    { 
      id: 'TODTH', 
      name: 'TransoceanDTH', 
      latitude: 26.0, 
      longitude: -89.8,
      additionalInfo: 'Operated by Transocean. Deepwater drilling rig.'
    },
    { 
      id: 'TODGD', 
      name: 'TransoceanDGD', 
      latitude: 26.5, 
      longitude: -90.0,
      additionalInfo: 'Operated by Transocean. Deepwater drilling rig.'
    }
  ];

  getRigs(): Observable<Rig[]> {
    return of(this.rigs);
  }
}
