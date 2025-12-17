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
      additionalInfo: 'Operated by SLB. Deepwater drilling rig.'
    },
    { 
      id: 'TODTH', 
      name: 'TransoceanDTH', 
      latitude: 26.0, 
      longitude: -89.8,
      additionalInfo: 'Operated by SLB. Deepwater drilling rig.'
    },
    { 
      id: 'TODPT', 
      name: 'TransoceanDPT', 
      latitude: 27.0, 
      longitude: -87.8,
      additionalInfo: 'Operated by SLB. Deepwater drilling rig.'
    },
    { 
      id: 'TODCQ', 
      name: 'TransoceanDCQ', 
      latitude: 26.8, 
      longitude: -91.4,
      additionalInfo: 'Operated by SLB. Deepwater drilling rig.'
    },
    { 
      id: 'TODGD', 
      name: 'TransoceanDGD', 
      latitude: 27.2, 
      longitude: -90.9,
      additionalInfo: 'Operated by SLB. Deepwater drilling rig.'
    },
    { 
      id: 'TODPN', 
      name: 'TransoceanDPN', 
      latitude: 25.9, 
      longitude: -88.7,
      additionalInfo: 'Operated by SLB. Deepwater drilling rig.'
    },
    { 
      id: 'TODVS', 
      name: 'TransoceanDVS', 
      latitude: 26.3, 
      longitude: -92.3,
      additionalInfo: 'Operated by SLB. Deepwater drilling rig.'
    },
    { 
      id: 'TOTSB', 
      name: 'TransoceanTSB', 
      latitude: 27.8, 
      longitude: -89.2,
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
      name: 'ST Drillmax', 
      latitude: 26.5, 
      longitude: -90.0,
      additionalInfo: 'Operated by SLB. Platform drilling rig.'
    }
  ];

  getRigs(): Observable<Rig[]> {
    return of(this.rigs);
  }
}
