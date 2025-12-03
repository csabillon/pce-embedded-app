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
      name: 'DS Doom', 
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
      name: 'DS Venom', 
      latitude: 27.0, 
      longitude: -87.8,
      additionalInfo: 'Operated by SLB. Deepwater drilling rig.'
    },
    { 
      id: 'BPTHU', 
      name: 'BP Thunderhorse', 
      latitude: 27.5, 
      longitude: -92.0,
      additionalInfo: 'Operated by BP. Platform drilling rig.'
    },
    { 
      id: 'STDMX', 
      name: 'DS Maximus', 
      latitude: 26.5, 
      longitude: -90.0,
      additionalInfo: 'Operated by SLB. Platform drilling rig.'
    }
  ];

  getRigs(): Observable<Rig[]> {
    return of(this.rigs);
  }
}
