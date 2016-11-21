//Declaring global variables
var map;
var markers = [];
var clientID;
var clientSecret;

//Error handling for Google Maps API
var maperror = setTimeout(function() {
    alert("can not load maps now. check your network");
    $('#map').append('<h1>Can not load Google maps now, check your network connection</h1>');
}, 5000);
//Model for storing location info
var locations = [
    {
        area: 'Railway station',
        wikiarea: 'Secunderabad Railway Station',
        divid: 'place0',
        lat: 17.4337,
        lng: 78.5016,
        serialNum: 0
    },{
        area: 'Mahatma Gandhi Bus Station',
        wikiarea: 'Mahatma Gandhi Bus Station',
        divid: 'place1',
        lat: 17.378055,
        lng: 78.48478439999997,
        serialNum: 1
    },{
        area: 'Charminar',
        wikiarea: 'Charminar',
        divid: 'place2',
        lat: 17.3609976,
        lng: 78.47306320000007,
        serialNum: 2
    },{
        area: 'Assembly',
        wikiarea: 'Telangana Assembly',
        divid: 'place3',
        lat: 17.3963738,
        lng: 78.4680902,
        serialNum: 3
    },{
        area: 'Salarjung museum',
        wikiarea: 'Salarjung museum',
        divid: 'place4',
        lat: 17.371265,
        lng: 78.47810900000002,
        serialNum: 4
    },{
        area: 'Golconda Fort',
        wikiarea: 'Golconda',
        divid: 'place5',
        lat: 17.3853626,
        lng: 78.4041297,
        serialNum: 5
    }
];

var Location = function(data) {
    this.areaName = ko.observable(data.area);
    this.wikiname = ko.observable(data.wikiarea);
    this.areaId = ko.observable(data.divid);
    this.divId = ko.computed(function(){
        var div = 'div' + this.areaId();
        return div;
    }, this);
    this.serialNum = ko.observable(data.serialNum);

    //The elements array will contain the short description of places obtained from Wikipedia
    this.elements = ko.observableArray([]);
    this.wikisrc = ko.observable(true);
    this.wiki = ko.computed(function() {
        var self = this;
        var wikiname = this.wikiname();
        var wikiurl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + wikiname + '&prop=revisions&rvprop=content&format=json';

        //Error Handling for Wikipedia API
        var wikierror = setTimeout(function() {
            self.elements.push("unable to load wikipedia");
            //localStorage is used because without it,
            //the alert message will pop-up multiple times
            var alert = localStorage.getItem('alert') || '';
            if (alert != 'yes') {
                alert("can not connect to wikipedia,check your internet connection");
                localStorage.setItem('alert','yes');
            }
            self.wikisrc(false);
        }, 5000);
        $.ajax({
            url: wikiurl,
            dataType: 'jsonp',
        }).done(function (results) {
            var wikistories = results[2];
            wikielements = wikistories[0];
            self.elements.push(wikielements);
            clearTimeout(wikierror);
        });
    }, this);

    this.wikiDescription = ko.observable('');
    this.listVisible = ko.observable(true);
    this.wikiVisible = ko.observable(false);
};

var ViewModel = function() {
    var self = this;
    //Clearing localstorage when the page loads
    localStorage.removeItem('alerted');
    this.LocationList = ko.observableArray([]);
    locations.forEach(function(area) {
        self.LocationList.push(new Location(area));
    });

    clientID = "V443OTCAQPJLCRY4QWBFYN3ZK5FDKGJOYDHLMI3O342IRVNN";
    clientSecret = "AK1JHLEG2D2KW14WF5HYVFNTUYFTBXYS4LDUUNRAHPR5URLB";

    //This function displays description of places obtained from Wikipedia
    this.displayDetails = function(thisPlace) {
        self.displayWikiDetails(this);
        clickList(this.serialNum());
    };

    markerDetails = function(thisId) {
        self.LocationList().forEach(function(place) {
            if(thisId === place.serialNum()) {
                self.displayWikiDetails(place);
            }
        });
    };

    this.displayWikiDetails = function(thisPlace) {
        thisPlace.wikiDescription(thisPlace.elements()[0]);
        self.LocationList().forEach(function(list) {
            list.wikiVisible(false);
        });
        thisPlace.wikiVisible(!thisPlace.wikiVisible());
    };
};

ko.applyBindings(new ViewModel());

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
           lat: 17.3850,
            lng: 78.4867
        },
        zoom: 13,
        mapTypeId: 'roadmap'
    });
 clearTimeout(maperror);
 //Take title and lat-lng from model and store it in localArray
    var len = locations.length;
    var localArray = [];
    for(var i = 0; i < len; i++) {
        var param = {
            locationtitle: locations[i].area,
            location: {
                lat: locations[i].lat,
                lng: locations[i].lng
            }
        };
        localArray.push(param);
    }

    var Infowindow = new google.maps.InfoWindow();

    var loclen = localArray.length;
    for (var j = 0; j < loclen; j++) {
        // Get the position and title from the localArray.
        var position = localArray[j].location;
        var locationtitle = localArray[j].locationtitle;
        // Create a marker per location, and put into markers array.
        var marker = new google.maps.Marker({
            position: position,
            map:map,
            title: locationtitle,
            animation: google.maps.Animation.DROP,
            id: j
        });

        // Push the marker to our array of markers.
        markers.push(marker);

        // Create an onclick event to open the large infowindow at each marker.
        marker.addListener('click', function() {
            generateInfoWindow(this, Infowindow);
            markerAnimation(this);
            markerDetails(this.id);
        });
    }
    //Animate marker when respective list item is clicked
    clickList = function(markerId) {
            var newMarker = markers[markerId];
            markerAnimation(newMarker);
            generateInfoWindow(newMarker, Infowindow);
    };

    function generateInfoWindow(newmarker, newinfowindow) {
        if (newinfowindow.newmarker != newmarker) {
            newinfowindow.setContent('');
            newinfowindow.newmarker = newmarker;
            newinfowindow.addListener('closeclick', function() {
                newinfowindow.newmarker = null;
            });
            var streetViewService = new google.maps.StreetViewService();
            var radius = 100;
            function getStreetView(data, status) {
                if (status == google.maps.StreetViewStatus.OK) {
                    var StreetViewLocation = data.location.latLng;
                    var heading = google.maps.geometry.spherical.computeHeading(
                        StreetViewLocation, newmarker.position);
                    newinfowindow.setContent('<div>' + newmarker.title + '</div><div>hi</div><div id="pano"></div>');
                    var panoramaOptions = {
                        position: StreetViewLocation,
                        pov: {
                            heading: heading - 60,
                            pitch: 30
                        }
                    };
                    var panorama = new google.maps.StreetViewPanorama(
                        document.getElementById('pano'), panoramaOptions);
                } else {
                    newinfowindow.setContent('<div>' + newmarker.title + '</div>' +
                        '<div>(No Street View Found)</div>');
                }
            }
            streetViewService.getPanoramaByLocation(newmarker.position, radius, getStreetView);
            // Open the infowindow on the correct marker.
            newinfowindow.open(map, newmarker);
        }
    }

    //Add bounce animation to markers
    function markerAnimation(newmarker) {
        newmarker.setAnimation(google.maps.Animation.BOUNCE);
        stopAnimation(newmarker);

        function stopAnimation(newmarker) {
            setTimeout(function () {
                newmarker.setAnimation(null);
            }, 1000);
        }
    }
}
