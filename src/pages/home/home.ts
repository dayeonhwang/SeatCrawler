import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { DetailsPage} from "../details/details";
import { AngularFireDatabase, FirebaseListObservable, } from 'angularfire2/database';

@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})
export class HomePage {


    cafe_list: FirebaseListObservable<any[]>;
    constructor(public navCtrl: NavController, public adb:  AngularFireDatabase) {
    this.cafe_list = this.adb.list('/cafe_list/');

    }

    pagedetails = DetailsPage;

}

