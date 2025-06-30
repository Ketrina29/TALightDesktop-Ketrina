import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopbarWidgetComponent } from './topbar-widget/topbar-widget.component';

import { AutoCompleteModule } from 'primeng/autocomplete';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { TabViewModule } from 'primeng/tabview';
import { TabMenuModule } from 'primeng/tabmenu';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';  // Importa il modulo Dropdown

@NgModule({
  declarations: [
    TopbarWidgetComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    AutoCompleteModule,
    InputTextModule,
    TooltipModule,
    ButtonModule,
    TabViewModule,
    TabMenuModule,
    DialogModule,
    DropdownModule  // Aggiungi DropdownModule qui
  ],
  exports: [
    TopbarWidgetComponent
  ]
})
export class TopbarModule { }
