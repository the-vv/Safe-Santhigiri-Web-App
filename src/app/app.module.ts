import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent, SafePipe } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; 


import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';


var firebaseConfig = {
  apiKey: "AIzaSyBC03NxbSWD67SebAzmK_rxm94ZZ7SDrRE",
    authDomain: "safesanthigiri.firebaseapp.com",
    databaseURL: "https://safesanthigiri.firebaseio.com",
    projectId: "safesanthigiri",
    storageBucket: "safesanthigiri.appspot.com",
    messagingSenderId: "708271619758",
    appId: "1:708271619758:web:247c084ad96211c992773f"
};


@NgModule({
  declarations: [
    AppComponent, SafePipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule, 
    ReactiveFormsModule,

    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireDatabaseModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
