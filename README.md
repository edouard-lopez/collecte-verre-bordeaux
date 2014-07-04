# Dataviz CUB: point d'apports volontaires

Dataviz project to visualize different type of trash collecting points in the area of Bordeaux, France.

![dataviz preview](./preview.png)

<!-- MarkdownTOC depth=3 -->

- Data Sources
- Install
	- Makefile
	- Getting started
- Want to fork or scaffold a similar project ?
	- License
	- Tools: GDAL (Geospatial Data Abstraction Library)
	- JavaScript Libraries
- Privacy

<!-- /MarkdownTOC -->


## Data Sources

* geo-location come from [official Gironde Open Data portal](http://www.datalocale.fr/dataset/en_empac_p) ;
* adress from [OpenStreetMap Nominatim](http://wiki.openstreetmap.org/wiki/Nominatim).

You may also find the website [Où recycler.fr](http://ourecycler.fr/point-collecte/33800/Bordeaux) interesting.


## Install

Start by cloning the project repository:
```bash
git clone https://github.com/edouard-lopez/collecte-verre-cub.git
cd collecte-verre-cub
```
And install some tooling:
```bash
npm install -g yo bower grunt-cli gulp topojson
```
### Makefile

There is a [makefile](./makefile) that automate the installation and data-mining tasks.

The default task will build a working environment and process data, you only need to run `make` in the project root directory. That is the equivalent to run:

```bash
make install clean .tmp
make get-emplacements extract-emplacements convert2geojson convert2geojsonVanilla convert2topojson reverse-location2adresses fix-reverse-location
```


### Getting started

Install project dependecy using `npm` and `bower`:
```bash
npm install
bower install
```
Run a preview with `gulp`:
```bash
gulp serve
```
Start playing !


## Want to fork or scaffold a similar project ?

### License

The Project under [GPLv3 license](http://choosealicense.com/licenses/gpl-3.0/).


### Tools: GDAL (Geospatial Data Abstraction Library)

To manipulate Shapefile, you need to have [`ogr2ogr`](http://www.gdal.org/ogr2ogr.html) command line, install [GDAL library](http://www.gdal.org/) for that:
```bash
sudo apt-get install gdal-bin
```


### JavaScript Libraries


So start by installing [Gulp webapp generator](https://www.npmjs.org/package/generator-gulp-webapp) for `yeoman`:
```bash
sudo npm install -g generator-gulp-webapp gulp
```

Continue by scaffolding the application with the `yeoman`'s generator:
```bash
mkdir my-map-app && cd my-map-app
yo gulp-webapp
```
Then install others dependencies:

* I'm using [LeafletJS for interactive map](http://leafletjs.com/) ;
* and [`d3.js` for the dataviz](http://d3js.org/).

```bash
npm install --save-dev jq xml2json-command topojson generator-gulp-webapp gulp gulp-sass
bower install --save topojson font-awesome d3 leaflet leaflet.markercluster es6-promise
```

Finish by running `gulp` for building and gulp watch for preview :
```bash
gulp watch
```


## Privacy

The use of **geo-location is completely optional**. Being done client-side there is no data store or collected by this app.
