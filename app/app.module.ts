import { NgModule } from '@angular/core'; 
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http'; // Importa HttpClientModule
// Componenti
import { AppComponent } from './app.component';
import { HomeViewComponent } from './views/home-view/home-view.component';
import { ConnectViewComponent } from './views/connect-view/connect-view.component';
import { SelectProblemViewComponent } from './views/select-problem-view/select-problem-view.component';
import { TutorialComponent } from './widgets/tutorial/tutorial.component';


// Moduli PrimeNG
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DropdownModule } from 'primeng/dropdown';
import { FileUploadModule } from 'primeng/fileupload';
import { TooltipModule } from 'primeng/tooltip';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SplitterModule } from 'primeng/splitter';
import { RadioButtonModule } from 'primeng/radiobutton';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TabViewModule } from 'primeng/tabview';
import { TabMenuModule } from 'primeng/tabmenu';

// Altri moduli
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { CodeEditorModule } from './widgets/code-editor/code-editor.module';

// Moduli personalizzati
import { TopbarModule } from './widgets/topbar/topbar.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Configurazione del routing
import { routes } from './routes';

// Aggiungi CUSTOM_ELEMENTS_SCHEMA se usi Web Components
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@NgModule({
  declarations: [
    AppComponent,
    HomeViewComponent,
    ConnectViewComponent,
    SelectProblemViewComponent,
    TutorialComponent,
    
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MonacoEditorModule.forRoot(),
    RouterModule.forRoot(routes),
    FormsModule,
    InputTextModule,
    InputSwitchModule,
    DropdownModule,
    DialogModule,
    ButtonModule,
    FileUploadModule,
    TooltipModule,
    ScrollPanelModule,
    SelectButtonModule,
    SplitterModule,
    RadioButtonModule,
    CodeEditorModule,
    TabViewModule,
    HttpClientModule,  // HttpClientModule importato correttamente
    TabMenuModule,
    TopbarModule  // Modulo per il topbar dichiarato una sola volta
  ],
  providers: [],

  bootstrap: [AppComponent], 
  schemas: [CUSTOM_ELEMENTS_SCHEMA] 
})
export class AppModule { }
