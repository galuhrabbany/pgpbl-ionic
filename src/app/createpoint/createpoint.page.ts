import { Component, OnInit, inject } from '@angular/core';
import { NavController, AlertController } from '@ionic/angular';
import { DataService } from '../data.service';
import * as L from 'leaflet';
import { icon, Marker } from 'leaflet';
import { ActivatedRoute, Router } from '@angular/router';

const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-createpoint',
  templateUrl: './createpoint.page.html',
  styleUrls: ['./createpoint.page.scss'],
  standalone: false,
})
export class CreatepointPage implements OnInit {
  map!: L.Map;
  marker!: L.Marker;

  pointId: string | null = null;
  name = '';
  coordinates = '';
  pageTitle = 'Create Point';

  private navCtrl = inject(NavController);
  private alertCtrl = inject(AlertController);
  private dataService = inject(DataService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  constructor() {}

  ngOnInit() {
    this.pointId = this.route.snapshot.paramMap.get('id');
    if (this.pointId) {
      this.pageTitle = 'Edit Point';
      this.loadPointData();
    }

    setTimeout(() => {
      this.setupMap();
    });
  }

  setupMap() {
    let initialCoords: L.LatLngExpression = [-7.7956, 110.3695];
    if (this.coordinates) {
      initialCoords = this.coordinates.split(',').map(c => parseFloat(c)) as L.LatLngExpression;
    }

    this.map = L.map('mapcreate').setView(initialCoords, 13);

    var osm = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    );

    var esri = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'ESRI',
      }
    );

    osm.addTo(this.map);

    var baseMaps = {
      OpenStreetMap: osm,
      'Esri World Imagery': esri,
    };

    L.control.layers(baseMaps).addTo(this.map);

    var tooltip =
      'Drag the marker or move the map<br>to change the coordinates<br>of the location';
    this.marker = L.marker(initialCoords, { draggable: true });
    this.marker.addTo(this.map);
    this.marker.bindPopup(tooltip);
    this.marker.openPopup();

    this.marker.on('dragend', (e) => {
      let latlng = e.target.getLatLng();
      let lat = latlng.lat.toFixed(9);
      let lng = latlng.lng.toFixed(9);
      this.coordinates = lat + ',' + lng;
    });
  }

  async loadPointData() {
    if (this.pointId) {
      try {
        const point: any = await this.dataService.getPointById(this.pointId);
        this.name = point.name;
        this.coordinates = point.coordinates;
        if (this.map) { // If map is already initialized
          const newCoords = this.coordinates.split(',').map(c => parseFloat(c)) as L.LatLngExpression;
          this.map.setView(newCoords, 13);
          this.marker.setLatLng(newCoords);
        }
      } catch (error) {
        console.error('Error loading point data', error);
      }
    }
  }

  async save() {
    if (this.name && this.coordinates) {
      try {
        const pointData = {
          name: this.name,
          coordinates: this.coordinates,
        };
        if (this.pointId) {
          await this.dataService.updatePoint(this.pointId, pointData);
        } else {
          await this.dataService.savePoint(pointData);
        }
        this.router.navigate(['/tabs/maps']);
      } catch (error: any) {
        const alert = await this.alertCtrl.create({
          header: 'Save Failed',
          message: error.message,
          buttons: ['OK'],
        });
        await alert.present();
      }
    }
  }
}