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
        mapCenter: new L.LatLng(44.8442, -0.5733),
        mapZoom: 15
    },

    /**
     * Map state
     * @type {Object}
     */
    STATE: {
        center: null,
        zoom: null
    },

    /**
     * Layer to cluster markers
     * @type {MarkerClusterGroupObject}
     */
    cluster: null,

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
     * Location detection ERROR listener
     * @param  {Object} e event handler data
     * @return {void}
     */
    onLocationError: function (e) {
        alert(e.message);
    },

    /**
     * Location detection SUCCESS listener
     * @param  {Object} e    event handler data
     * @param  {Object} pav current context
     * @return {void}
     */
    onLocationFound: function (e, pav) {
        var radius = e.accuracy / 2;

        L.marker(e.latlng)
            .addTo(pav.map)
            // .bindPopup("You are within " + radius + " meters from this point")
            // .openPopup()
        ;
        L.circle(
            e.latlng,
            radius,
            {
                color: '#3465a4',
                fillColor: '#729fcf'
            }
        ).addTo(pav.map);
    },

    /**
     * Hightlight marker given in the URL fragment attribut 'pav'
     * @return {void}
     */
    highlightMarker: function () {
        var rePav = /pav=([\d\w]+)/;

        var hash = window.location.hash;
        if (hash !== '' && hash !== null) {
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
        this.STATE.center = this.DEFAULT.mapCenter; // when no value
        this.STATE.zoom = this.DEFAULT.mapZoom;

        var reCenter = /c=(\-?\d+(\.\d+)?),\s*(\-?\d+(\.\d+)?)/;
        var reZoom = /z=(\d{1,2})/;

        var hash = window.location.hash;
        if (hash !== '' && hash !== null) {
            var _center = reCenter.exec(hash);
            this.STATE.zoom = reZoom.exec(hash)[1] || this.DEFAULT.mapZoom;

            if (_center !== null) {
                var lat = _center[1];
                var lng = _center[3];
                if (_center.length === 3) {
                    lat = _center[1];
                    lng = _center[2];
                }
                this.STATE.center = new L.LatLng(lat, lng) || this.DEFAULT.mapCenter;
            }
        }
        this.map
            .setView(this.STATE.center, this.STATE.zoom)
            .locate({setView: true, maxZoom: 16})
        ;

        return this;
    },

    /**
     * Get adresses JSON file to map with data points in addItemToMap()
     * @return {pavMapObject} current object
     */
    getAdress: function () {
        var pav = this; // needed when in d3 context

        return new Promise(function (resolve, reject) {
            d3.json('scripts/location2adresses.json', function (adr) {
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
     * Update popup content (share URL) on zoom end
     * @param  {Object} pav current instance
     * @return {void}
     */
    updatePopupZoomLevel: function (pav) {
        return function () {
            var shareLink = $('.active-popup .share');
            if (shareLink.length > 0) {
                var newLink = shareLink.attr('href').replace(/z=(\d{1,2})/, 'z=' + pav.map.getZoom());
                shareLink.attr('href', newLink);
            }
        };
    },

    /**
     * Return HTML content for pop.
     * @param  {Object} d data to inject in template
     * @return {HTML}   HTML content
     */
    getPopupContent: function (d) {
        return sprintf(
            '<div class="active-popup">' +
            '	<h4>%s</h4>' +
            '	<p>partager: <a href="#c=%s&pav=%s&z=%d" target="_blank" class="share">%s <i class="fa fa-external-link"></i></a>' +
            '	<br/>' +
            '	<abbr title="référence">réf.</abbr>: <small>%s</small>' +
            '	</p>' +
            '</div>',
            d.label, d.latLng, d.id, d.zoom, d.latLng, d.id
        );
    },

    /**
     * Load data on the
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
                                    alt: '<placeholder>'
                                }
                            );
                        },
                        onEachFeature: function (feature, layer) {
                            var id = feature.properties.IDENT;
                            id = id !== null ? id.replace(' ', '') : id;
                            var cid = feature.geometry.coordinates[0] + ',' + feature.geometry.coordinates[1];
                            var label = cid in pav.adresses ? pav.adresses[cid].split(', ') : 'rue inconnue.';
                            label[0] = '<b>' + label[0] + '</b>';
                            label = label.join('<br/>');
                            var latLng = layer.getLatLng().lat + ',' + layer.getLatLng().lng;
                            var zoom = pav.map.getZoom() || pav.DEFAULT.mapZoom;
                            var d = {
                                id: id,
                                label: label,
                                zoom: zoom,
                                latLng: latLng
                            };
                            var html = pav.getPopupContent(d);

                            layer.options.alt = id; // add attribute to <img>, used for URL reference
                            layer
                                .bindPopup(html, {className: 'code' + id})
                                .on('click', pav.updatePopupZoomLevel(pav), false)
                            ;
                            pav.markerList[id] = layer;
                        }
                    }
                ).addTo(pav.cluster);

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

            iconSize: [19, 32], // size of the icon
            shadowSize: [29, 32], // size of the shadow
            iconAnchor: [8.5, 32], // point of the icon which will correspond to marker's location
            shadowAnchor: [6, 32],  // the same for the shadow
            popupAnchor: [0, -28] // point from which the popup should open relative to the iconAnchor
        });

        return this;
    },

    /**
     * Location of tiles (see next paragraph)
     * @type {Object}
     */
    attachTileLayer: function () {
        new L.tileLayer(
            'https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png',
            {
                id: 'edouard-lopez.ik52o4kd',
                continuousWorld: true,  // very important
                attribution: '' +
                '© <a href="http://metadata.lacub.fr/geosource/apps/search/?uuid=1f8a4be0-900e-4eab-9dcf-55cd9f0a1aed">La CUB</a>' +
                ' | ' +
                '© <a href="http://www.openstreetmap.org/copyright"><abbr title="OpenStreetMap">OSM</abbr>, ODbL 1.0</a>'
            }
        ).addTo(this.map);

        return this;
    },

    /**
     * Markers' cluster Layer
     * @type {Object}
     */
    attachClusterLayer: function () {
        this.cluster = new L.MarkerClusterGroup({
            showCoverageOnHover: false,
            maxClusterRadius: 80,
            disableClusteringAtZoom: 16
        }).addTo(this.map);

        return this;
    },

    /**
     * Initialization of core map settings
     * @return {pavMapObject} current object
     */
    init: function () {
        this.map = L.map('map', {
            center: this.DEFAULT.center, // Bordeaux latitude/longitude
            zoom: this.DEFAULT.zoom,
            minZoom: 0,
            maxZoom: 18
        });
        var pav = this; // look ugly
        this.map.on('locationfound', function (e) {
            pav.onLocationFound(e, pav);
        });
        this.map.on('locationerror', function (e) {
            pav.onLocationError(e, pav);
        });
        return this;
    }
};

(function (window, document, _) {
    _.init()
        .attachTileLayer()
        .attachClusterLayer()
        .customizeMarker()
        .setMapState()
        .getAdress()
        .then(function (app) {
            app.addItemToMap().then(function (app) {
                app.highlightMarker();
            })
            ;
        });
    _.map.on('zoomend', _.updatePopupZoomLevel(_));
}(window, document, pavMap));
