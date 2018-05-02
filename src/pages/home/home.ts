import { Component} from '@angular/core';
import { NavController } from 'ionic-angular';
import { DetailsPage} from "../details/details";
import { AngularFireDatabase,AngularFireList} from 'angularfire2/database';
import {Geolocation} from "@ionic-native/geolocation";
import {LatLng} from '@ionic-native/google-maps';//LocationService
import {HttpClient} from "@angular/common/http";
import { Spherical} from "@ionic-native/google-maps";
import { Observable} from "rxjs/Observable";

@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})
export class HomePage {
  cafe_list: Observable<any[]>; // cafe list from firebase
  angularList: AngularFireList<{}>;
  pagedetails = DetailsPage; // Jump another page
  coords: LatLng;
  apiResults: any;
  show_list: Array<any>;
  matchedResults: Observable<any[]>;

  constructor(public navCtrl: NavController, public adb: AngularFireDatabase, private http: HttpClient, private geolocation: Geolocation, private spherical: Spherical) {
    var maxShowLen = 10; // max cafe num on home list page
    var set = new Set();
    this.show_list = [];
    this.geolocation.getCurrentPosition().then((resp) => {
      // get user's current coordination using google's place nearbysearch api
      var userCoords = new LatLng(resp.coords.latitude, resp.coords.longitude);
      this.http.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=' +
        resp.coords.latitude
        // '42.057681'
        + ',' +
        // '-87.685719'
        resp.coords.longitude
        + '&rankby=distance&type=cafe&key=AIzaSyCfPG3wQmh-RMjmgY1F3xipVbmkvdq49RM').subscribe(
        data => {
          this.apiResults = data["results"];

          // console.log(this.apiResults);

          this.matchedResults = this.apiResults;
          var i = 0;
          var showNum = 0;
          var resLen = Object.keys(this.apiResults).length;
          while (i < resLen && showNum < maxShowLen) {
            var apiResult = this.apiResults[i]
            var id = apiResult.place_id;
            let res = this.adb.object('/cafe_list/' + id);
            res.valueChanges().subscribe(item => {
              // if cafe's id doesn't exist in firebase, add it to firebase with its distance info

                if(item!=null && item['id']!=undefined){
                  //console.log(apiResult["geometry"]);
                  item["distance"] = compute_distance(userCoords, item["coordinates"]);

                  // set color based on the result from google api
                   var newStatus = chooseColor(getCurrentPop(item));

                  // set color based on the result from user input
                  //console.log(chooseColor(item["busyness"][0][1]));
                  //var newStatus = chooseColor(item["busyness"][0][1]);


                  item["status"] = newStatus;
                  this.adb.object('/cafe_list/'+item["id"]).update({ status: newStatus});
                  if(!set.has(item['id'])) {
                    set.add(item['id']);
                    this.show_list.push(item);
                    showNum++;
                  }
                }
            });
            i++;
          }
        });
    });

  };
}

function compute_distance(coords1, coords2) {

    //temporary version   -- straight-line distance
    var dis = (getDistanceFromLatLonInKm(coords1["lat"],coords1["lng"],coords2["lat"],coords2["lng"])/1.61).toFixed(1);
    return dis;
}

// function
function chooseColor(pop){
    // choose color base on the current popularity
    if(pop === -1) {
        return "black";
    }else if(pop == 0) {
        return "gray"
    } else if(pop < 30) {
        return "green"
    } else if(pop < 80) {
        return "orange"
    } else {
        return "red"
    }
}


function getCurrentPop(cafe){
    let date = new Date();
    // get current date and hour
    let hours = date.getHours();
    let day = date.getDay();
    console.log("date",date);
    console.log("date.now", Date.now());
    let time_diff = Math.round(Date.now()/60000)-cafe.busyness[0][0];//current time in form of milliseconds
    console.log("time_diff", time_diff);
    if (cafe.busyness[0][1] && (time_diff < 60)){
      console.log("Using busyness ",cafe.busyness[0][1])
      return cafe.busyness[0][1];
    }
    else if(cafe.populartimes==null){
        return -1; 
        // @Bruce this should get new places data, and upload them to firebase
        // if the data doesn't exist, return -1 make the color become black
    } else {
    	if(day===0){ // the day is sunday
    		day = 7
    	}
    console.log("using places", cafe.populartimes[(day-1)]["data"][hours])
    return cafe.populartimes[(day-1)]["data"][hours];
    }
}

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1);
  var a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}
