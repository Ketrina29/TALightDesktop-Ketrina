import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent  {
  ngOnInit() {
  }
  title = 'TALightDesktop';  // Proprietà title

  
 TAL_SERVER: string = 'wss://ta.di.univr.it/algo';  // URL di configurazione
 

  // Metodo per cambiare il titolo
  changeTitle() {
    this.title = 'New Title';  // Cambia il titolo direttamente
  }
  }
