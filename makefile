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
			.tmp/reverse-location2adresses.json \
			app/scripts/location2adresses.json
get-emplacements: .tmp/${dataFile}.shp.zip
extract-emplacements: .tmp/${dataFile}
convert2geojson: .tmp/${dataFile}.geo.json
convert2geojsonVanilla: .tmp/${dataFile}.vanilla.geo.json
convert2topojson: .tmp/${dataFile}.topo.json
reverse-location2adresses: .tmp/reverse-location2adresses.json
fix-reverse-location: app/scripts/location2adresses.json


# Reverse Geocoding: http://wiki.openstreetmap.org/wiki/Nominatim#Parameters_2
# @alias: fix-reverse-location
# @format: JSON
app/scripts/location2adresses.json:
	@printf "Fixing…\n\tMalformed JSON\n"
	head -n -1 .tmp/reverse-location2adresses.json \
		| awk '{ print } END {printf "]"}' \
		| jq 'reduce .[] as $$i ({}; . + {"\($$i.lon),\($$i.lat)": "\($$i.display_name)"})' \
		| sed 's/, Gironde.*"/"/g' \
	> $@


# Reverse Geocoding: http://wiki.openstreetmap.org/wiki/Nominatim#Parameters_2
# @alias: reverse-reverse-location2adresses
# @format: JSON
.tmp/reverse-location2adresses.json:
	@printf "Fetching…\n\tAdresses\n"
	@rm -f $@

	@printf "Geo-reversing...\n"
	@printf '[\n' >> $@
	@while read -r lat lng; do \
		(( cnt++ )); \
		printf "\t%d: %s, %s\n" "$$cnt" "$$lat" "$$lng"; \
		curl --silent --show-error --user-agent 'Makefile Script (~912 items)' \
			"http://nominatim.openstreetmap.org/reverse?format=json&lat=$$lat&lon=$${lng}&zoom=17&addressdetails=1&email=dev+osm@edouard-lopez.com" \
			| jq '.lon = "'$$lng'" | .lat = "'$$lat'" ' \
			| awk '{ print } END { printf ","}' \
		>> $@; \
	done < <(jq -r '.features[] .geometry .coordinates | "\(.[1]) \(.[0])" ' .tmp/${dataFile}.geo.json)


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
	@cp $@ app/scripts/


# Convert from Shapefile to geoJSON keeping only interesting fields and changing projection:
# 	* from: EPSG:2154 → Lambert-93
# 	* to :	EPSG:4326 → WGS 84
# @alias: convert2geojson
# @format: geoJSON
.tmp/${dataFile}.geo.json: extract-emplacements
	@printf "Converting…\n\tShapefile → GeoJSON\n"
	@ogr2ogr \
		-f GeoJSON \
		-t_srs EPSG:4326 \
		-lco COORDINATE_PRECISION=7 \
		-sql "SELECT CAST(GID as Integer), IDENT, MDATE FROM EN_EMPAC_P" \
		$@ .tmp/${dataFile}/*.shp
	@cp $@ app/scripts/

# Convert from Shapefile to geoJSON with all fields
# @alias: convert2geojsonVanilla
.tmp/${dataFile}.vanilla.geo.json: extract-emplacements
	@printf "Converting…\n\tShapefile → GeoJSON (Vanilla)\n"
	@ogr2ogr \
		-f GeoJSON \
		-t_srs EPSG:4326 \
		-lco COORDINATE_PRECISION=7 \
		$@ .tmp/${dataFile}/*.shp

# Extract Emplacements d'apport volontaire de la CUB
# @alias: extract-emplacements
# @format: Shapefile
.tmp/${dataFile}: get-emplacements
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
