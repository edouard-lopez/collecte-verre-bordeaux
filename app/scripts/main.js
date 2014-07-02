'use strict';
var L, d3, sprintf;

/**
* Display glass trash can on a map using data from http://www.datalocale.fr/dataset/en_empac_p
* @param  {[type]} window    [description]
* @param  {[type]} document  [description]
* @param  {[type]} L         [description]
* @param  {[type]} undefined [description]
* @return {[type]}           [description]
*/

var pavMap = { // pav = point d'apport volontaire

	/**
	 * The leaftlet map object.
	 * @link: http://leafletjs.com/reference.html#map-class
	 * @type {[type]}
	 */
	map: null,

	/**
	 * DEFAULT parameters
	 * @type {Object}
	 */
	DEFAULT: {
		mapCenter: new L.LatLng(44.8442, -0.5933),
		mapZoom: 14
	},

	/**
	 * Marker object used by leaftlet (e.g. broken bottle, glass)
	 * @link: http://leafletjs.com/reference.html#marker
	 * @type {object} customized object
	 */
	marker: null,

	/**
	 * Store marker added to the map, indexed by pid so we can retrieve them.
	 * For instance, to pop them up
	 * @type {Object}
	 */
	markerList: {},

	/**
	 * List of adresses to match against geoJSON data
	 * @type {object} indexed by 'IDENT'
	 */
	adresses: null,

	/**
	 * Hightlight marker given in the URL fragment attribut 'pav'
	 * @return {void}
	 */
	highlightMarker: function () {
		var rePav = /pav=([\d\w]+)/;

		var hash = window.location.hash;
		if (hash !== "" && hash !== null) {
			var pid = rePav.exec(hash)[1];
			var selector = sprintf('[alt="%s"]', pid);

			$(selector).attr('src', 'images/icon.active.png');
			this.markerList[pid].openPopup();
		}
	},

	/**
	 * Set or restore map state
	 * @return {pavMapObject} current object
	 */
	setMapState: function () {
		var center = this.DEFAULT.mapCenter; // when no value
		var zoom = this.DEFAULT.mapZoom ;

		var reCenter = /c=(\-?\d+(\.\d+)?),\s*(\-?\d+(\.\d+)?)/;
		var reZoom = /z=(\d{1,2})/;

		var hash = window.location.hash;
		if (hash !== "" && hash !== null) {
			var _center = reCenter.exec(hash);
			var zoom = reZoom.exec(hash)[1] || this.DEFAULT.mapZoom ;

			if (_center !== null) {
				var lat = _center[1];
				var lng = _center[3];
				if (_center.length === 3) { lat = _center[1]; lng = _center[2]; }
				center = new L.LatLng(lat, lng);
			}

		}
		this.map.setView(center, zoom);

		return this;
	},

	/**
	* Get adresses JSON file to map with data points in addItemToMap()
	* @return {pavMapObject} current object
	*/
	getAdress: function () {
		var pav = this; // needed when in d3 context

		return new Promise(function (resolve, reject) {
			d3.json('scripts/adresses.json', function (adr) {
				pav.adresses = adr;

				if (pav.adresses !== null) {
					resolve(pav);
				} else {
					reject(Error(adr));
				}
			});
		});
	},

	/**
	* Load data on the map
	* @param  {JSON} geojson data
	* @return {pavMapObject} current object
	*/
	addItemToMap: function () {
		var pav = this; // needed when in d3 context

		return new Promise(function (resolve, reject) {
		d3.json('scripts/emplacements-pav.geo.json', function (geojson) {
			L.geoJson(geojson,
				{
					pointToLayer: function (feature, latLng) {
						return L.marker(latLng,
							{
								icon: pav.marker,
								alt: '<placeholder>',
							}
						);
					},
					onEachFeature: function (feature, layer) {
						var id = feature.properties.IDENT;
						var label = id in pav.adresses ? pav.adresses[id] :  'rue inconnue.';
						var latLng = layer.getLatLng().lat+','+layer.getLatLng().lng;
						var zoom = pav.map.getZoom() || pav.DEFAULT.mapZoom ;

						var html = sprintf(
							'<dl class="dl-horizontal">' +
							'	<dt class="text-muted"><abbr title="adresse">addr.</abbr>:</dt>' +
							'	<dd>%s</dd>' +
							'	<dt class="text-muted"><abbr title="Ouvrir dans un nouvel onglet">coord.</abbr>:</dt>' +
							'	<dd><a href="#c=%s&pav=%s&z=%d" target="_blank">%s <i class="fa fa-external-link"></i></a></dd>' +
							'	<dt class="text-muted"><abbr title="numéro/code">code</abbr>:</dt>' +
							'	<dd><small>%s</small></dd>' +
							'</dl>',
							label, latLng, id, zoom, latLng, id
						);
						layer.options.alt = id; // add attribute to <img>, used for URL reference
						layer.bindPopup(html, {className: 'code'+id })
						.on('click', function() {
								console.log(latLng);
							}
						);
						pav.markerList[id] = layer;
					 }
				}
			).addTo(pav.map);

			if (Object.keys(pav.markerList).length > 0) {
				resolve(pav);
			} else {
				reject(Error(geojson));
			}
		});
		});
	},

	/**
	* Define custom icon
	* @return {pavMapObject} current object
	*/
	customizeMarker: function () {
		this.marker = L.icon({
			iconUrl: 'images/icon.png',
			shadowUrl: 'images/icon.shadow.png',

			iconSize:     [19, 32], // size of the icon
			shadowSize:   [29, 32], // size of the shadow
			iconAnchor:   [8.5, 32], // point of the icon which will correspond to marker's location
			shadowAnchor: [6, 32],  // the same for the shadow
			popupAnchor:  [0, -28] // point from which the popup should open relative to the iconAnchor
		});

		return this;
	},

	/**
	* Location of tiles (see next paragraph)
	* @type {Object}
	*/
	addLayerToMap: function () {
		new L.tileLayer(
			'https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png',
			{
				id: 'edouard-lopez.ik52o4kd',
				continuousWorld: true,  // very important
				attribution: '' +
				'© <a href="http://metadata.lacub.fr/geosource/apps/search/?uuid=1f8a4be0-900e-4eab-9dcf-55cd9f0a1aed">La CUB</a>' +
				' | ' +
				'© <a href="http://ourecycler.fr/point-collecte/33800/Bordeaux">OùRecycler.fr</a>'
			}
		).addTo(this.map);

		return this;
	},

	/**
	 * Initialization of core map settings
	 * @return {pavMapObject} current object
	 */
	init: function () {
		this.map = L.map('map', {
			center:  this.DEFAULT.center, // Bordeaux latitude/longitude
			zoom: this.DEFAULT.zoom,
			minZoom: 0,
			maxZoom: 18,
		})

		return this;
	}

};

(function (window, document, map) {
	map.init()
		.addLayerToMap()
		.customizeMarker()
		.setMapState()
		.getAdress()
		.then(function(app) {
			app.addItemToMap().then(function (app) {
				app.highlightMarker() });
		});

}(window, document, pavMap));
