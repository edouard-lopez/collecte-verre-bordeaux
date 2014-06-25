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
default:		install
			.tmp
			.tmp/${dataFile}.shp.zip \
			.tmp/${dataFile} \
			.tmp/${dataFile}.geo.json \
			.tmp/${dataFile}.topo.json
get-emplacements: .tmp/${dataFile}.shp.zip
extract-emplacements: .tmp/${dataFile}
convert2geojson: .tmp/${dataFile}.geo.json
convert2topojson: .tmp/${dataFile}.topo.json

# Convert from GeoJSON to TopoJSON
# @alias: convert2topojson
# @format: topoJSON
.tmp/${dataFile}.topo.json:
	@printf "Convert...\n\tGeoJSON → TopoJSON\n"
	@topojson \
		--id-property GID \
		-p IDENT_X 	-p IDENT_Y
		--quantization 1e4 \
		--simplify-proportion 0.025 \
		.tmp/${dataFile}.geo.json \
	| underscore print > $@
	ln -nf $@ app/scripts/


# Convert from Shapefile to TopoJSON
# @alias: convert2geojson
# @format: geoJSON
.tmp/${dataFile}.geo.json:
	@printf "Converting…\n\tShapefile → GeoJSON\n"
	@ogr2ogr \
		-f GeoJSON $@ \
		.tmp/${dataFile}/*.shp
	ln -nf $@ app/scripts/


# Extract Emplacements d'apport volontaire de la CUB
# @alias: extract-emplacements
# @format: Shapefile
.tmp/${dataFile}:
	@printf "Extracting (overwrite)…\n"
	unzip -o .tmp/${dataFile}.shp.zip -d .tmp/${dataFile}


# Download Emplacements d'apport volontaire de la CUB
# @alias: get-emplacements
# @source: http://catalogue.datalocale.fr/dataset/en_empac_p
# @format: Zip
# @projection: Lambert93
.tmp/${dataFile}.shp.zip: .tmp
	@printf "Fetching…\n\tEmplacements d'apport volontaire de la CUB data\n"
	# @curl --output $@ 'http://data.lacub.fr/files.php?gid=69&format=1'
	@curl --output $@ 'http://data.lacub.fr/files.php?layer=EN_EMPAC_P&ext=SHP_L93'


# Create .tmp/ directory if needed
.tmp:
	[[ ! -d .tmp ]] && mkdir .tmp


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
