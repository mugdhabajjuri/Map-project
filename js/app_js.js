//Declaring global variables
var map;
var marker;
var markers = [];
//Error handling for Google Maps API
var maperror = setTimeout(function() {
   alert("can not load maps now. check your network");
   $('#map').append('<h1>Can not load Google maps now, check your network connection</h1>');
}, 5000);
// Declaring Model with data
var locations = [{
   area: 'Lumbini park',
   wikiarea: 'Lumbini park',
   wikiid: 'place0',
   lat: 17.4101,
   lng: 78.4732,
   serialNum: 0
}, {
   area: 'Mahatma Gandhi Bus Station',
   wikiarea: 'Mahatma Gandhi Bus Station',
   wikiid: 'place1',
   lat: 17.3799,
   lng: 78.4830,
   serialNum: 1
}, {
   area: 'Charminar',
   wikiarea: 'Charminar',
   divid: 'place2',
   lat: 17.3609976,
   lng: 78.47306320000007,
   serialNum: 2
}, {
   area: 'Hussain Sagar',
   wikiarea: 'Hussain Sagar',
   wikiid: 'place3',
   lat: 17.4239,
   lng: 78.4738,
   serialNum: 3
}, {
   area: 'Salarjung museum',
   wikiarea: 'Salarjung museum',
   wikiid: 'place4',
   lat: 17.3715,
   lng: 78.4803,
   serialNum: 4
}, {
   area: 'Golconda Fort',
   wikiarea: 'Golconda',
   wikiid: 'place5',
   lat: 17.3853626,
   lng: 78.4041297,
   serialNum: 5
}, {
   area: 'Ramoji Film City',
   wikiarea: 'Ramoji Film City',
   wikiid: 'place6',
   lat: 17.2543,
   lng: 78.6808,
   serialNum: 6
}];
var Location = function(data) {
   this.areaName = ko.observable(data.area);
   this.wikiname = ko.observable(data.wikiarea);
   this.areaId = ko.observable(data.wikiid);
   this.wikiId = ko.computed(function() {
      var div = 'div' + this.areaId();
      return div;
   }, this);
   this.serialNum = ko.observable(data.serialNum);
   this.visible = ko.observable(true);
   //The elements array will contain description of places obtained from Wikipedia
   this.elements = ko.observableArray([]);
   this.wikisrc = ko.observable(true);
   this.wiki = ko.computed(function() {
      var self = this;
      var wikiname = this.wikiname();
      var wikiurl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + wikiname + '&prop=revisions&rvprop=content&format=json';
      //Handling wikipedia error on timeout.
      var wikierror = setTimeout(function() {
         self.elements.push("unable to load wikipedia");
         //localStorage is used to avoid the error message appears multiple times
         var check = localStorage.getItem('check') || '';
         if (check != 'yes') {
            alert("can not connect to wikipedia,check your internet connection");
            localStorage.setItem('check', 'yes');
         }
         self.wikisrc(false);
      }, 5000);
      $.ajax({
         url: wikiurl,
         dataType: 'jsonp',
      }).done(function(results) {
         var wikistories = results[2];
         wikielements = wikistories[0];
         self.elements.push(wikielements);
         clearTimeout(wikierror);
      });
   }, this);
   this.wikiVisible = ko.observable(false);
   this.wikiDescription = ko.observable('');
};
var ViewModel = function() {
   var self = this;
   this.searchTerm = ko.observable("");
   localStorage.removeItem('alerted');
   //Location list array will hold the information on area of locations.
   this.LocationList = ko.observableArray([]);
   locations.forEach(function(area) {
      self.LocationList.push(new Location(area));
   });
   //This function is used to filter the markers based on searched locations.
   this.search = function(value) {
      for (var x in locations) {
         if (locations[x].area.toLowerCase().indexOf(value.toLowerCase()) >= 0) {
            markers[x].setVisible(true);
         } else markers[x].setVisible(false);
      }
   };
   this.searchTerm.subscribe(self.search);
   //Filtered list function will filter the list of locations based on search term.
   this.filteredList = ko.computed(function() {
      console.log('-------------');
      var filter = self.searchTerm().toLowerCase();
      if (!filter) {
         self.LocationList().forEach(function(locationItem) {
            locationItem.visible(true);
         });
         return self.LocationList();
      } else {
         return ko.utils.arrayFilter(self.LocationList(), function(locationItem) {
            //console.log(locationItem);
            var string = locationItem.areaName().toLowerCase();
            var result = (string.search(filter) >= 0);
            locationItem.visible(result);
            console.log(filter, string, result);
            return result;
         });
      }
   });
   //displayPlaceDetails function will display the description about the places searched from Wikipedia
   this.displayPlaceDetails = function(thisPlace) {
      self.displayWikiDetails(this);
      clickList(this.serialNum());
   };
   //markerDetails function will display the details of the place when a marker is clicked.
   markerDetails = function(Id) {
      self.LocationList().forEach(function(place) {
         if (Id === place.serialNum()) {
            self.displayWikiDetails(place);
         }
      });
   };
   //displayWikiDetails function will display the wikipedia article details obtained from wikipedia.
   this.displayWikiDetails = function(selectedPlace) {
      selectedPlace.wikiDescription(selectedPlace.elements()[0]);
      self.LocationList().forEach(function(list) {
         list.wikiVisible(false);
      });
      selectedPlace.wikiVisible(!selectedPlace.wikiVisible());
   };
};
// Applying all the bindings of knockout.
ko.applyBindings(new ViewModel());
// This function initiates the map with the given co-ordinates.
function initMap() {
   map = new google.maps.Map(document.getElementById('map'), {
      center: {
         lat: 17.3850,
         lng: 78.4867
      },
      zoom: 11,
      // Styles to the map referenced from https://developers.google.com/maps/documentation/javascript/styling.
      styles: [{
         featureType: 'road',
         elementType: 'geometry.fill',
         stylers: [{
            color: '#38414e'
         }]
      }, {
         featureType: 'road.highway',
         elementType: 'geometry.fill',
         stylers: [{
            color: '#1f2835'
         }]
      }, {
         featureType: 'transit',
         elementType: 'geometry.fill',
         stylers: [{
            color: '#2f3948'
         }]
      }, {
         featureType: 'water',
         elementType: 'geometry.fill',
         stylers: [{
            color: 'blue'
         }]
      }, ]
   });
   clearTimeout(maperror);
   //LocalArray holds the map latitude and longitude and title
   var len = locations.length;
   var localArray = [];
   for (var i = 0; i < len; i++) {
      var param = {
         locationtitle: locations[i].area,
         location: {
            lat: locations[i].lat,
            lng: locations[i].lng
         }
      };
      localArray.push(param);
   }
   // Instantiating the infowindow.
   var Infowindow = new google.maps.InfoWindow();
   var loclen = localArray.length;
   for (var i = 0; i < loclen; i++) {
      // Get the position and location title from the localArray.
      var position = localArray[i].location;
      var locationtitle = localArray[i].locationtitle;
      // Markers array will hold the markers of all locations.
      marker = new google.maps.Marker({
         position: position,
         map: map,
         title: locationtitle,
         animation: google.maps.Animation.DROP,
         id: i
      });
      // Adding the each marker to the markers array
      markers.push(marker);
      // Click event will be fired for the marker and generates infowindow,animation and details.
      marker.addListener('click', function() {
         generateInfoWindow(this, Infowindow);
         markerAnimation(this);
         markerDetails(this.id);
      });
   }
   //clickList function generates infowindow and marker animation when respective list item is clicked.
   clickList = function(markerId) {
      var newMarker = markers[markerId];
      markerAnimation(newMarker);
      generateInfoWindow(newMarker, Infowindow);
   };
    //generateInfoWindow function will generates an infowindow whle a marker or list-item is clicked.
   function generateInfoWindow(newmarker, newinfowindow) {
      if (newinfowindow.newmarker != newmarker) {
         newinfowindow.setContent('');
         newinfowindow.newmarker = newmarker;
         newinfowindow.addListener('closeclick', function() {
            newinfowindow.newmarker = null;
         });
         //Instantiating street view service.
         var streetViewService = new google.maps.StreetViewService();
         var radius = 100;

         function getStreetView(data, status) {
            if (status == google.maps.StreetViewStatus.OK) {
               var StreetViewLocation = data.location.latLng;
               var heading = google.maps.geometry.spherical.computeHeading(
                  StreetViewLocation, newmarker.position);
               newinfowindow.setContent('<div>' + newmarker.title + '</div><div id="streetview"></div>');
               var panoramaOptions = {
                  position: StreetViewLocation,
                  pov: {
                     heading: heading - 60,
                     pitch: 30
                  }
               };
               var panorama = new google.maps.StreetViewPanorama(
                  document.getElementById('streetview'), panoramaOptions);
            } else {
               newinfowindow.setContent('<div>' + newmarker.title + '</div>' +
                  '<div>(No Street View Found)</div>');
            }
         }
         streetViewService.getPanoramaByLocation(newmarker.position, radius, getStreetView);
         // Generates an info window of selected marker
         newinfowindow.open(map, newmarker);
      }
   }
   //Add icon-change animation to markers
   function markerAnimation(newmarker) {
    // Referenced from http://stackoverflow.com/questions/11064081/javascript-change-google-map-marker-color
      newmarker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');
      stopAnimation(newmarker);

      function stopAnimation(newmarker) {
         setTimeout(function() {
            newmarker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
            newmarker.setAnimation(null);
         }, 4000);
      }
   }
}