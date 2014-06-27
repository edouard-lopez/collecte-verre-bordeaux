/**
* Display glass trash can on a map using data from http://www.datalocale.fr/dataset/en_empac_p
* @param  {[type]} window    [description]
* @param  {[type]} document  [description]
* @param  {[type]} L         [description]
* @param  {[type]} undefined [description]
* @return {[type]}           [description]
*/
(function (window, document, L, d3) {
	'use strict';

	var adresses = {};

	/**
	 * Core map settings
	 * @type {[type]}
	 */
	var map = L.map('map', {
		center:  new L.LatLng(44.8442, -0.5933), // Bordeaux latitude/longitude
		zoom: 14,
		minZoom: 0,
		maxZoom: 18,
		attribution: '© <a href="http://metadata.lacub.fr/geosource/apps/search/?uuid=1f8a4be0-900e-4eab-9dcf-55cd9f0a1aed">La CUB</a>'
	});

	/**
	 * Location of tiles (see next paragraph)
	 * @type {Object}
	 */
	new L.tileLayer(
		'https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png',
		{
			id: 'edouard-lopez.ik52o4kd',
			continuousWorld: true,  // very important
		}
	).addTo(map);

	/**
	 * Define custom icon
	 * @type {void}
	 */
	var glassTrash = L.icon({
		iconUrl: 'images/broken-bottle.png',
		shadowUrl: 'images/broken-bottle.shadow.png',

		iconSize:     [19, 32], // size of the icon
		shadowSize:   [29, 32], // size of the shadow
		iconAnchor:   [9.5, 32], // point of the icon which will correspond to marker's location
		// shadowAnchor: [4, 62],  // the same for the shadow
		popupAnchor:  [0, -28] // point from which the popup should open relative to the iconAnchor
	});

	/**
	 * Load data on the map
	 * @param  {JSON} geojson data
	 * @return {void}
	 */
	function addItemToMap() {
	d3.json('scripts/emplacements-pav.geo.json', function (geojson) {
		L.geoJson(geojson,
			{
				pointToLayer: function (feature, latLng) {
					return L.marker(latLng, {icon: glassTrash});
				},
				onEachFeature: function (feature, layer) {
					var id = adresses.indexOf(feature.properties.IDENT);
					var label = id == -1 ? 'rue inconnue.' : adresses[id+1];
					var latLng = layer.getLatLng().lat+','+layer.getLatLng().lng;

					layer.bindPopup('<b>'+ label + '</b>'
					                + '<br/>partager: <a href="#' + latLng + '">' + latLng + '</a>'
					                + '<br/><small>#' + id + '</small>'
		                )
				    .on('click', function() {
			    			console.log(latLng);
			    		}
			      )}
			}
		).addTo(map);
	});
	}

	/**
	 * Get adresses JSON file to map with data points in addItemToMap()
	 * @return {void} [description]
	 */
	function getAdress() {
		return new Promise(function (resolve, reject) {
		d3.json('scripts/adresses.json', function (adr) {
			adresses = adr;
			resolve();
		});
		});
	}

	getAdress().then(addItemToMap);

}(window, document, L, d3));

