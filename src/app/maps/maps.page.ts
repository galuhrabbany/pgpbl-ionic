import { Component, OnInit, inject } from '@angular/core';
import { AlertController } from '@ionic/angular';
import * as L from 'leaflet';
import { DataService } from '../data.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-maps',
  templateUrl: './maps.page.html',
  styleUrls: ['./maps.page.scss'],
  standalone: false,
})
export class MapsPage implements OnInit {
  map!: L.Map;
  pointMarkers: L.Marker[] = [];

  private dataService = inject(DataService);

  constructor(private alertCtrl: AlertController, private router: Router) {
    // ✅ Move your icon override here (runs when class is created)
    const iconRetinaUrl = 'assets/marker-icon-2x.png';
    const iconUrl = 'assets/marker-icon.png';
    const shadowUrl = 'assets/marker-shadow.png';
    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41],
    });

    L.Marker.prototype.options.icon = iconDefault;
  }

  async presentDeleteConfirm(key: string) {
    const alert = await this.alertCtrl.create({
      header: 'Konfirmasi Hapus',
      message: 'Apakah Anda yakin ingin menghapus titik ini?',
      buttons: [
        {
          text: 'Batal',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Hapus',
          handler: () => {
            this.dataService.deletePoint(key).then(() => {
              this.map.closePopup();
              this.loadPoints();
            });
          },
        },
      ],
    });

    await alert.present();
  }

  async loadPoints() {
    this.pointMarkers.forEach((marker) => this.map.removeLayer(marker));
    this.pointMarkers = [];

    const points: any = await this.dataService.getPoints();
    for (const key in points) {
      if (points.hasOwnProperty(key)) {
        const point = points[key];
        const coordinates = point.coordinates
          .split(',')
          .map((c: string) => parseFloat(c));
        const marker = L.marker(coordinates as L.LatLngExpression).addTo(
          this.map
        );

        const popupContent = `
          ${point.name}<br>
          <ion-button class="edit-button" data-key="${key}" color="warning" size="small">
            <ion-icon name="create-outline"></ion-icon>
          </ion-button>
          <ion-button class="delete-button" data-key="${key}" color="danger" size="small">
            <ion-icon name="trash-outline"></ion-icon>
          </ion-button>
        `;
        marker.bindPopup(popupContent);
        this.pointMarkers.push(marker);
      }
    }

    this.map.on('popupopen', (e) => {
      const popup = e.popup;
      const deleteButton = popup.getElement()?.querySelector('.delete-button');
      if (deleteButton) {
        // Prevent multiple listeners
        if (!(deleteButton as any)._clickListener) {
          const listener = () => {
            const key = deleteButton.getAttribute('data-key');
            if (key) {
              this.presentDeleteConfirm(key);
            }
          };
          deleteButton.addEventListener('click', listener);
          (deleteButton as any)._clickListener = listener;
        }
      }

      const editButton = popup.getElement()?.querySelector('.edit-button');
      if (editButton) {
        if (!(editButton as any)._clickListener) {
          const listener = () => {
            const key = editButton.getAttribute('data-key');
            if (key) {
              this.router.navigate(['/createpoint', key]);
            }
          };
          editButton.addEventListener('click', listener);
          (editButton as any)._clickListener = listener;
        }
      }
    });
  }

  ngOnInit() {
    if (!this.map) {
      setTimeout(() => {
        this.map = L.map('map').setView([-7.7956, 110.3695], 13);

        var osm = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution: '&copy; OpenStreetMap contributors',
          }
        );

        osm.addTo(this.map);

        L.marker([-7.7956, 110.3695])
          .addTo(this.map)
          .bindPopup('yogyakarta')
          .openPopup();

        this.loadPoints();
      });
    }
  }
}