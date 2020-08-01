import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AngularFireDatabase } from 'angularfire2/database';
import * as firebase from 'firebase/app';

import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

// for map url 
@Pipe({
  name: 'safe'
})
export class SafePipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) { }
  transform(url) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

}


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'sample-projecT';
  registerForm: FormGroup;
  editForm: FormGroup;
  submitted = false;
  sdistance = 0;
  scondition = ""
  slon = 0;
  slat = 0;
  qflag = false;
  static YourID = 0;
  url = 'https://maps.google.com/maps?q=kerala&Roadmap&z=10&ie=UTF8&iwloc=&output=embed';
  map = true;
  total = NaN;
  loadingStatus = "Initializing Databases and Location...";
  Online = true;

  locationset = false;
  editform = false;
  updtstatus = "";
  dbupdtstatus = false;
  public editid = 100;
  public static lattemp = '0';
  public static lottemp = '0';

  refresh(): void {
    window.location.reload();
  }

  public addType: boolean = true;
  public home: boolean = true;  //false for temporary
  public items: Array<any> = [];
  public location: Array<any> = [];
  public pinlist: Array<any> = [];
  public itemRef: firebase.database.Reference;
  public promptEvent: any;

  constructor(private db: AngularFireDatabase,
    private formBuilder: FormBuilder,
    private ref: ChangeDetectorRef) {

      window.addEventListener('beforeinstallprompt', event => {
        this.promptEvent = event;
      });

    if (navigator.onLine) {
      this.loadingStatus = this.loadingStatus + "<br>Network Status: OK";
    }

  }
  ngOnInit() {
    this.registerForm = this.formBuilder.group({
      id: [],
      Name: ['', Validators.required,],
      gender: ['', Validators.required,],
      age: [, [Validators.required, Validators.max(150), Validators.min(0)],],
      phone: ['', [Validators.required, Validators.maxLength(10), Validators.minLength(10)],],
      adno: ['', Validators.required,],
      email: ['', Validators.email],
      condition: ['', Validators.required,],
      feedback: [''],
      lat: ['', Validators.required,],
      lon: ['', Validators.required,],
      state: ['', Validators.required,],
      pin: ['', [Validators.required, Validators.maxLength(6), Validators.minLength(6)],],
      qsdate: [],
    }, {
    });
    this.editForm = this.formBuilder.group({
      editbox: [],
      editcondition: ["Safe"],
    });
    this.getLocation();
    this.getAll();
    this.TimerFunct();
  }
  get f() { return this.registerForm.controls; }

  installPwa(): void {
    this.promptEvent.prompt();
  }

  TimerFunct() {
    setTimeout(() => {
      // console.log(AppComponent.lottemp, AppComponent.lattemp); &&
      // console.log(this.items.length);
      if ((AppComponent.lattemp != '0' || AppComponent.lottemp != '0') && this.items.length > 0) {
        // console.log(AppComponent.lottemp, AppComponent.lattemp);
        this.qdatefix();
        this.distancecalc();
        this.Online = true;
        this.locationset = true;
      }
      else {
        // console.log('not ready');
        // this.getLocation();
        this.TimerFunct();
      }

      if (!navigator.onLine) {
        this.loadingStatus = "";
        this.Online = false;
      }

    }, 100);
  }

  getRandomInt(min = 100000, max = 999999) {
    min = Math.ceil(min);
    max = Math.floor(max);
    AppComponent.YourID = Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
    // console.log(AppComponent.YourID);
  }

  distancecalc() {
    if (this.items.length > 0 && this.items[0].value.condition != "Safe") {
      this.sdistance = this.distance(this.items[0].value.lat, this.items[0].value.lon, AppComponent.lattemp, AppComponent.lottemp);
      this.scondition = this.items[0].value.condition;
      // console.log(this.sdistance)
      this.url = 'https://maps.google.com/maps?q=' + this.items[0].value.pin + '&Roadmap&z=10&ie=UTF8&iwloc=&output=embed'
      this.slon = this.items[0].value.lon;
      this.slat = this.items[0].value.lat;
      // var td = this.distance(this.items[0].value.lat, this.items[0].value.lon, AppComponent.lattemp, AppComponent.lottemp);
      // this.sdistance = td;
    }
    if (this.items.length > 0) {
      this.pinlist.push('https://maps.google.com/maps?q=' + this.items[0].value.pin + '&Roadmap&z=10&ie=UTF8&iwloc=&output=embed');
    }
    for (var i = 1; i < this.items.length; i++) {
      this.pinlist.push('https://maps.google.com/maps?q=' + this.items[i].value.pin + '&Roadmap&z=10&ie=UTF8&iwloc=&output=embed');
      if (this.items[i].value.condition != "Safe") {
        var td = this.distance(this.items[i].value.lat, this.items[i].value.lon, AppComponent.lattemp, AppComponent.lottemp);
        // console.log(td);
        if (this.sdistance == 0 || td < this.sdistance) {
          this.sdistance = td;
          this.scondition = this.items[i].value.condition;
          this.slon = this.items[i].value.lon;
          this.slat = this.items[i].value.lat;
          // console.log("Distance: ", td);
          this.url = 'https://maps.google.com/maps?q=' + this.items[i].value.pin + '&Roadmap&z=10&ie=UTF8&iwloc=&output=embed'
          this.map = true;
        }
      }

    }
    // console.log(this.slat, this.slon);
    this.sdistance = Math.ceil(this.sdistance);
    // console.log(this.sdistance);
    // console.log(this.pinlist);
  }

  // fetch data from Database 
  getAll() {
    this.itemRef = firebase.database().ref('/CovidDB/');
    this.itemRef.on('value', itemSnapshot => {
      this.items = [];
      itemSnapshot.forEach(itemSnap => {
        // console.log(itemSnap)
        this.items.push({
          "id": itemSnap.key,
          "value": itemSnap.val()
        }
        );
        return false;
      });
      this.items.reverse();
      // console.log(this.items);
      this.total = this.items.length;
      // console.log("total Updates: ", this.total)
      this.ref.detectChanges();
    });
  }

  // find the distance between two locations
  distance(lat1, lon1, lat2, lon2, unit = "K") {
    // console.log(lat1)
    // console.log(lon1)
    // console.log(lat2)
    // console.log(lon2)

    var radlat1 = Math.PI * lat1 / 180
    var radlat2 = Math.PI * lat2 / 180
    var radlon1 = Math.PI * lon1 / 180
    var radlon2 = Math.PI * lon2 / 180
    var theta = lon1 - lon2
    var radtheta = Math.PI * theta / 180
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist)
    dist = dist * 180 / Math.PI
    dist = dist * 60 * 1.1515
    if (unit == "K") { dist = dist * 1.609344 }
    if (unit == "N") { dist = dist * 0.8684 }
    return dist
  }

  qscheck() {
    if (this.registerForm.value.condition == "Quarentine") {
      this.qflag = true;
    }
    else {
      this.qflag = false;
    }
  }

  // go to edit form
  editmode() {
    this.updtstatus = "";
    this.home = false;
    this.editform = true;
  }

  public regerrors = false;

  // check for form errors and push data to database
  onSubmit() {
    this.submitted = true;
    if (this.registerForm.invalid) {
      this.regerrors = true;
      return;
    }
    // console.log(this.registerForm.value);

    this.db.list("CovidDB").push(this.registerForm.value);
    this.distancecalc();
    this.addType = false
    this.onReset();
  }

  // reset form
  onReset() {
    this.submitted = false;
    this.regerrors = false;
    this.registerForm.reset();
    this.gotohome();
  }

  // go back to home
  goBack() {
    this.addType = true;
    this.editform = false;
    this.regerrors = false;
  }

  // go to details view
  goToList() {
    this.addType = false;
    this.editform = false;
    this.regerrors = false;
  }

  // go to regirtration form
  gotoadd() {
    this.regerrors = false;
    this.editform = false;
    this.home = false;
    this.getRandomInt();
    this.items.forEach(function (val) {
      // console.log(val)
      // console.log(AppComponent.YourID)
      if (val.value.id == AppComponent.YourID) {
        this.gotoadd();
      }
    });
    this.registerForm.controls.id.setValue(AppComponent.YourID);
  }

  // go to updates view
  gotoview() {
    this.regerrors = false;
    this.home = false;
    this.addType = false;
    this.editform = false;
    // this.distancecalc();
  }

  // go to home
  gotohome() {
    this.regerrors = false;
    this.home = true;
    this.addType = true;
    this.editform = false;
  }

  // update current location on form
  putLocation() {
    this.registerForm.controls.lat.setValue(AppComponent.lattemp);
    this.registerForm.controls.lon.setValue(AppComponent.lottemp);
    // this.registerForm.patchValue({
    //   lat:AppComponent.lattemp,
    //   lon:AppComponent.lottemp 
    // })
  }

  // fetching location
  getLocation() {
    navigator.geolocation.watchPosition(function (position) {
    },
      function (error) {
        if (error.code == error.PERMISSION_DENIED)
          alert("you denied Location Permission :-(\nWithout location Permission, it will not function properly. please allow it by going to settings.");
      });
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this.showPosition);
      // console.log("Location Request send");
    } else {
      // console.log("Geolocation is not supported by this browser.");
    }

  }

  temprec = NaN;

  // used to format date in html input format
  formatDate() {
    var d = new Date(),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2)
      month = '0' + month;
    if (day.length < 2)
      day = '0' + day;

    return [year, month, day].join('-');
  }

  // checks if quarentine passed 14 days and set as expired if it is
  qdatefix() {
    for (var i = 0; i < this.items.length; i++) {
      if (this.items[i].value.qsdate) {
        let qsdate = this.items[i].value.qsdate;
        let today = this.formatDate();
        // console.log(today);
        // console.log(qsdate);
        var ctoday: Array<any> = [today.split("-")];
        var cqsdate: Array<any> = [qsdate.split("-")];
        // console.log(ctoday[0][0]);
        var firstDate: any = new Date(ctoday[0][0], ctoday[0][1], ctoday[0][2]);
        var secondDate: any = new Date(cqsdate[0][0], cqsdate[0][1], cqsdate[0][2]);
        // console.log(secondDate)
        // console.log(firstDate); 
        const oneDay = 24 * 60 * 60 * 1000;
        var diffDays = Math.round(Math.abs((firstDate - secondDate) / oneDay));
        // console.log(diffDays);
        if (diffDays > 14) {
          // console.log(this.items[i].value['condition']);
          this.items[i].value['condition'] = 'Quarentine (Expired)'
        }
      }

    }
  }

  // used to update data in the database
  updateval() {
    if (!this.editForm.controls.editbox.value) {
      // console.log('Please Enter a private id');
      this.updtstatus = "Please Enter Your Private ID and select condition";
      return;
    }
    else {
      this.updtstatus = "";
      let boxvalue = this.editForm.controls.editbox.value;
      // console.log(this.items);
      let newval = this.editForm.controls.editcondition.value;
      var i = 0;
      console.log(this.items.length)
      for (i = 0; i < this.items.length; i++) {
        console.log(i);
        // console.log(val)
        // console.log(val.value.id);
        if (boxvalue == this.items[i].value.id) {
          // console.log(val.id);
          // console.log(val.value);
          let temprecord = this.items[i].value;
          temprecord["condition"] = newval;
          temprecord["qsdate"] = "";
          // console.log(temprecord);
          // console.log(val.id);
          firebase.database().ref().child('/CovidDB/' + this.items[i].id + '/').remove();
          this.temprec = temprecord;
          break;
        }
      }
      if (i == this.items.length) {
        this.updtstatus = "No matching ID Found";
        this.temprec = NaN;
      }
      if (this.temprec) {
        this.db.list("CovidDB").push(this.temprec);
        this.updtstatus = "Updated";
        this.temprec = NaN;
      }
    }
  }

  // delete value in the database
  deleteval() {
    if (!this.editForm.controls.editbox.value) {
      // console.log('Please Enter a private id');
      this.updtstatus = "Please Enter Your Private ID";
      return;
    }
    // console.log(this.editForm.controls.editbox.value);
    let boxvalue = this.editForm.controls.editbox.value;
    // console.log(this.items);
    var i = 0;
    for (i = 0; i < this.items.length; i++) {
      // console.log(val)
      // console.log(val.value.id);
      if (boxvalue == this.items[i].value.id) {
        // console.log(val.id);
        firebase.database().ref().child('/CovidDB/' + this.items[i].id + '/').remove();
        this.updtstatus = "Deleted"
        break;
      }
    }
    if (i == this.items.length) {
      this.updtstatus = "No matching ID Found";
      this.temprec = NaN;
    }
  }

  // set current location on variables
  showPosition(position) {
    // console.log("location set");
    // console.log(position.coords.latitude);
    // console.log(position.coords.longitude);
    AppComponent.lattemp = position.coords.latitude;
    AppComponent.lottemp = position.coords.longitude;
  }

}