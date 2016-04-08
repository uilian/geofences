// General map options
var mOptions = {
   // Avoid perspective map option
   tilt:0,
   zoom: 14,
   // Center the map on Porto Alegre, Brazil.
   center: {lat: -30.03211600, lng: -51.23040500}
};      

var deselectedColor = {fillColor: '#0099FF'},
    selectedColor = {fillColor: '#FF9900'};

// Polygon options
var pOptions = {
   editable: true,
   draggable: true,
   strokeColor: '#999',
   strokeOpacity: 0.6,
   strokeWeight: 2,
   fillColor: '#0099FF',
   fillOpacity: 0.35,
   zIndex: 1               
};

/*
function CustomControl(controlDiv, map) {
   // Set CSS for the control border
   var controlUI = document.createElement('div');
   controlUI.style.direction = 'ltr';
   controlUI.style.overflow = 'hidden';
   controlUI.style.textAlign = 'center';
   controlUI.style.position = 'relative';
   controlUI.style.color = 'rgb(86,86,86)';
   controlUI.style.borderBottomRightRadius = '2px';
   controlUI.style.borderTopRightRadius = '2px';
   controlUI.style.boxShadow = 'rgba(0, 0, 0, 0.298039) 0px 1px 4px -1px';
   controlUI.style.borderLeftWidth = '0px';
   controlUI.style.backgroundClip = 'padding-box';

   
   controlUI.style.backgroundColor = '#fff';
   controlUI.style.borderStyle = 'solid';
   controlUI.style.borderWidth = '1px';
   controlUI.style.borderColor = '#fff';
   controlUI.style.height = '24px';
   controlUI.style.marginTop = '5px';
   controlUI.style.marginLeft = '-8px';
   controlUI.style.paddingTop = '1px';
   controlUI.style.cursor = 'pointer';
   controlUI.style.textAlign = 'center';
   controlUI.title = 'Click to set the map to Home';
   controlDiv.appendChild(controlUI);

   // Set CSS for the control interior
   var controlText = document.createElement('div');
   controlText.style.fontFamily = ' Roboto, Arial, sans-serif';
   controlText.style.fontSize = '10px';
   controlText.style.paddingLeft = '4px';
   controlText.style.paddingRight = '4px';
   controlText.style.marginTop = '2px';
   controlText.innerHTML = 'x Del';
   controlUI.appendChild(controlText);

   // Setup the click event listeners
   google.maps.event.addDomListener(controlUI, 'click', function () {
      console.log('Custom control clicked!!!');
   });

   google.maps.event.addDomListener(controlUI,'mouseover', function(event) {
      return({fillColor: 'gray'});
   });

}
*/

var map;
var selectedShape;

function initMap() {
   // Map definition
   map = new google.maps.Map(document.getElementById('map'), mOptions);

   // Drawing controls definition
   var drawingManager = new google.maps.drawing.DrawingManager({
      drawingControl: true,
      drawingControlOptions: {
         style: google.maps.MapTypeControlStyle.DEFAULT,
         position: google.maps.ControlPosition.TOP_CENTER,
         drawingModes: [
            google.maps.drawing.OverlayType.POLYGON
         ]
      },
      polygonOptions: pOptions
   });   
   drawingManager.setMap(map);

   // Listeners definitions
   google.maps.event.addListener(
      drawingManager, 
      'overlaycomplete', 
      function(e){onDrawComplete(e,drawingManager)}
   );
   google.maps.event.addDomListener(
      document.getElementById('getCoordinates'), 
      'click', 
      getCoordinates
   );

   google.maps.event.addDomListener(
      document.getElementById('removePolygon'), 
      'click', 
      removePolygon
   );

   // Create the DIV to hold the control and call the CustomControl() constructor passing in this DIV.
   //var customControlDiv = document.createElement('div');
   //var customControl = new CustomControl(customControlDiv, map);

   //customControlDiv.index = 1;
   //map.controls[google.maps.ControlPosition.TOP_CENTER].push(customControlDiv);

}

/* 
   Add an event listener that selects the newly-drawn  
   shape when the user mouses down on it.
*/
function onDrawComplete(event,dManager) {
   // Switch back to non-drawing mode after drawing a shape.
   dManager.setDrawingMode(null);
      
   var newShape = event.overlay;
   newShape.type = event.type;
   
   // Only 3 or more vertices can form a polygon
   if (newShape.getPath().length > 2){
      google.maps.event.addListener(newShape, 'click', function () {
         setSelection(newShape);
      });

      setSelection(newShape);         
      clearSelection();

      var deleteNode = function(mev) {
        if (mev.vertex != null) {
          this.getPath().removeAt(mev.vertex);
        }
      }
      // Right click on a vertice will remove it.
      google.maps.event.addListener(newShape, 'rightclick', deleteNode);
   } else {
      // If it's not a polygon, remove from map.
      newShape.setMap(null);      
   }
}

/* Changes previous selectedShape edit 
   to false, set the new one to true. */
function setSelection(shape) {
   clearSelection();
   selectedShape = shape;
   shape.setOptions(selectedColor); 
   shape.setEditable(true);
   shape.setDraggable(true);
}

/* Changes selectedShape edition status to false. */
function clearSelection() {
   if (selectedShape) {
      selectedShape.setOptions(deselectedColor);
      selectedShape.setEditable(false);
      selectedShape.setDraggable(false);      
      selectedShape = null;
   }
}

/* Returns the coordinates list from the selectedShape. */
function getCoordinates() {
   if (selectedShape) {
      var vertices = selectedShape.getPath();            
      var htmlStr = "";
      vertices.forEach(function(e,i){
         htmlStr += '<li>' + e.toUrlValue(10) + '</li>';
      });
      document.getElementById('info').innerHTML = htmlStr;
   } else {
      document.getElementById('info').innerHTML = '<li>No polygon selected!</li>';
   }
}        

/*  */
function removePolygon() {
   if (selectedShape) {
      selectedShape.setMap(null);
      selectedShape = null;
   } else {
      console.log('No object selected.');
   }
}


/* Submits search to DB and add the result to the map. */
function getSpots(e) {
   var baseUrl="/wifi/spots?latitude=";
   var url= baseUrl + e.latlng.lat;
   url+= "&longitude="+ e.latlng.lng + "&distance=" + $('#radius').val();
   $.getJSON(url, 
      function (data) {               
         var wifimarker = L.ExtraMarkers.icon({
            icon: 'fa-wifi',
            markerColor: 'black',
            shape: 'circle',
            prefix: 'fa'
         });

         // cleanup map
         removeSpots();

         for (var i = 0; i < data.length; i++) {
            // Locations are stored as long/lat pairs.
            var location = new L.LatLng(data[i].local[1], data[i].local[0]);                  
            var title = "<div style='font-size: 18px; color: #0078A8;'>"+ data[i].nome +"</div>";
            var address = "<div style='font-size: 14px;'>" + data[i].endereco + "</div>";
            var marker = L.marker(location, {icon: wifimarker});
            
            // to future cleanup
            markers.push(marker);

            marker.addTo(map);
            marker.bindPopup(
               "<div style='text-align: center; margin-left: auto; margin-right: auto;'>"
               + title + address + "</div>", 
               {maxWidth: '400'}
            );
         }
      }
   )
}

/* Removes all dynamically inserted marker from the map.*/
function removeSpots() {
   for (i=0; i < markers.length; i++) {
      map.removeLayer(markers[i]);
   }
}