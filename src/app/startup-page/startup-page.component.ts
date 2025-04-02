import { Component, OnInit, OnDestroy } from '@angular/core';
import * as L from 'leaflet';
import { Subscription } from 'rxjs';
import { NavigationService } from '../navigation.service';
import { RigLocationService, Rig } from '../rig-location.service';
import { Router } from '@angular/router';
import { ThemeService } from '../theme.service';

@Component({
  selector: 'app-startup-page',
  templateUrl: './startup-page.component.html',
  styleUrls: ['./startup-page.component.css'],
  standalone: true
})
export class StartupPageComponent implements OnInit, OnDestroy {
  private map!: L.Map;
  private rigSubscription!: Subscription;
  private themeSubscription!: Subscription;
  private tileLayer!: L.TileLayer;
  rigs: Rig[] = [];
  currentTheme: string = 'light';

  constructor(
    private rigLocationService: RigLocationService,
    private navigationService: NavigationService,
    private router: Router,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.initMap();
    this.loadRigs();
    this.subscribeToTheme();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
    if (this.rigSubscription) {
      this.rigSubscription.unsubscribe();
    }
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  private initMap(): void {
    // Create the map without the default attribution control.
    this.map = L.map('startupMap', { attributionControl: false }).setView([26.0, -90.0], 6);
    // Set initial tile layer based on current theme.
    this.currentTheme = this.themeService.getTheme();
    this.setTileLayerForTheme(this.currentTheme);
  }

  private setTileLayerForTheme(theme: string): void {
    if (this.tileLayer) {
      this.map.removeLayer(this.tileLayer);
    }
    let tileUrl: string;
    let attribution: string;
    if (theme === 'dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      attribution = '© OpenStreetMap contributors, © CARTO';
    } else {
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '© OpenStreetMap contributors';
    }
    this.tileLayer = L.tileLayer(tileUrl, {
      attribution: attribution
    });
    this.tileLayer.addTo(this.map);
  }

  private subscribeToTheme(): void {
    this.themeSubscription = this.themeService.theme$.subscribe(theme => {
      this.currentTheme = theme;
      this.setTileLayerForTheme(theme);
    });
  }

  private loadRigs(): void {
    this.rigSubscription = this.rigLocationService.getRigs().subscribe((rigs: Rig[]) => {
      this.rigs = rigs;
      this.addMarkers();
    });
  }

  private addMarkers(): void {
    this.rigs.forEach(rig => {
      // Create a circle marker for each rig.
      const marker = L.circleMarker([rig.latitude, rig.longitude], {
        radius: 8,
        color: '#3388ff',
        fillColor: '#3388ff',
        fillOpacity: 0.8
      }).addTo(this.map);
      
      // Build popup content dynamically using rig properties:
      // Display rig name, its coordinates (formatted), and additional info if available.
      const popupContent = `<b>${rig.name}</b><br>` +
        `Coordinates: ${rig.latitude.toFixed(2)}, ${rig.longitude.toFixed(2)}<br>` +
        `${rig.additionalInfo || ''}`;
      
      // Bind the popup to the marker.
      marker.bindPopup(popupContent, { closeButton: false });
      
      // Open popup on mouseover and close on mouseout.
      marker.on('mouseover', () => marker.openPopup());
      marker.on('mouseout', () => marker.closePopup());
      
      // On marker click, select the rig and navigate to the BOP Stack page.
      marker.on('click', () => this.onRigClick(rig));
    });
  }

  private onRigClick(rig: Rig): void {
    // Set the selected rig (using its id, as NavigationService expects a string).
    this.navigationService.selectRig(rig.id);
    // Navigate to the BOP Stack dashboard (assumed to be at /app/bopstack).
    this.router.navigate(['/app/bopstack']);
  }
}
