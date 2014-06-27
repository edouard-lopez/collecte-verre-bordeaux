#!/usr/bin/env make
# DESCRIPTION
#   Grab and build data to run the project
#
# USAGE
#   cd ~/projects/dataviz-cub-pav && make
#
# @author: Édouard Lopez <dev+cub-pav@edouard-lopez.com>

ifneq (,)
This makefile requires GNU Make.
endif

# force use of Bash
SHELL := /bin/bash


# function
today=$(shell date '+%Y-%m-%d')
dataFile=emplacements-pav

.PHONY: default
default:		install clean .tmp \
			.tmp/${dataFile}.shp.zip \
			.tmp/${dataFile} \
			.tmp/${dataFile}.geo.json \
			.tmp/${dataFile}.topo.json \
			.tmp/adresses.xml \
			.tmp/adresses.xml \
			app/scripts/adresses.json
get-emplacements: .tmp/${dataFile}.shp.zip
extract-emplacements: .tmp/${dataFile}
convert2geojson: .tmp/${dataFile}.geo.json
convert2geojsonVanilla: .tmp/${dataFile}.vanilla.geo.json
convert2topojson: .tmp/${dataFile}.topo.json
get-adresses: .tmp/adresses.xml
adresses2json: app/scripts/adresses.json

# Convert to JSON and reduce to {'id': 'street-name'} array
# @alias: adresses2json
# @format: JSON
app/scripts/adresses.json:
	@printf "Reducing as JSON…\n"
	xml2json < .tmp/adresses.xml \
		| jq '.markers | [.marker[] | (.avancee), (.addresse)]' \
	 > $@


# Fetch adress (street name) from http://ourecycler.fr/point-collecte/33800/Bordeaux
# @alias: get-adresses
# @format: XML
.tmp/adresses.xml:
	@printf "Fetching…\n\tAdresses\n"
	@curl --progress-bar --output $@ \
		-H 'Accept: text/html,application/xhtml+xml,application/xml' \
		-H 'Referer: http://ourecycler.fr/' \
		'http://ourecycler.fr/generateur.php?SO_Lt=44.72813137800844&SO_Lg=-0.7978765942382324&NE_Lt=44.94723833119456&NE_Lg=-0.36048340576166993&typ=1&dech=1'


# Convert from GeoJSON to TopoJSON
# @alias: convert2topojson
# @format: topoJSON
.tmp/${dataFile}.topo.json:
	@printf "Convert...\n\tGeoJSON → TopoJSON\n"
	@topojson \
		--id-property GID \
		--quantization 1e4 \
		--simplify-proportion 0.025 \
		.tmp/${dataFile}.geo.json \
	| underscore print > $@
	ln -nf $@ app/scripts/


# Convert from Shapefile to geoJSON keeping only interesting fields and changing projection:
# 	* from: EPSG:2154 → Lambert-93
# 	* to :	EPSG:4326 → WGS 84
# @alias: convert2geojson
# @format: geoJSON
.tmp/${dataFile}.geo.json:
	@printf "Converting…\n\tShapefile → GeoJSON\n"
	ogr2ogr \
		-f GeoJSON \
		-t_srs EPSG:4326 \
		-lco COORDINATE_PRECISION=6 \
		-sql "SELECT CAST(GID as Integer), IDENT, MDATE FROM EN_EMPAC_P" \
		$@ .tmp/${dataFile}/*.shp
	ln -nf $@ app/scripts/

# Convert from Shapefile to geoJSON with all fields
# @alias: convert2geojsonVanilla
.tmp/${dataFile}.vanilla.geo.json:
	ogr2ogr \
		-f GeoJSON \
		-t_srs EPSG:4326 \
		-lco COORDINATE_PRECISION=6 \
		$@ .tmp/${dataFile}/*.shp

# Extract Emplacements d'apport volontaire de la CUB
# @alias: extract-emplacements
# @format: Shapefile
.tmp/${dataFile}:
	@printf "Extracting (overwrite)…\n"
	@unzip -q -o .tmp/${dataFile}.shp.zip -d .tmp/${dataFile}


# Download Emplacements d'apport volontaire de la CUB
# @alias: get-emplacements
# @source: http://catalogue.datalocale.fr/dataset/en_empac_p
# @format: Zip
# @projection: Lambert93 (EPSG:2154)
.tmp/${dataFile}.shp.zip: .tmp
	@printf "Fetching…\n\tEmplacements d'apport volontaire de la CUB data\n"
	@curl --progress-bar --output $@ 'http://data.lacub.fr/files.php?layer=EN_EMPAC_P&ext=SHP_L93'


# Create .tmp/ directory if needed
.tmp:
	@[[ ! -d .tmp ]] && mkdir .tmp


clean:
	@printf "Cleaning…\n\t.tmp/ directory\n"
	@rm -rf .tmp
	@rm -f app/scripts/emplacements*.json
	@rm -f app/scripts/adresses*.json


# Install tooling and library
install:
	@printf "Installing system-wide (Ubuntu)…\n"
	sudo apt-get -y install gdal-{bin,contrib}
	sudo npm install -g topojson underscore gulp generator-gulp-webapp
	@printf "Install project-wide (Ubuntu)…\n"
	npm install --save-dev topojson generator-leaflet underscore gulp
	npm install --save-dev gulp-{usemin,uglify,minify-{html,css},rev}
	yo gulp-webapp
	bower install --save polymaps topojson font-awesome d3 d3-plugins
