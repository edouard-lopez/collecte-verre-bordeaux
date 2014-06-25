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
			app/scripts/${dataFile}.geo.json
get-emplacements: .tmp/${dataFile}.shp.zip
extract-emplacements: .tmp/${dataFile}
convert2geojson: app/scripts/${dataFile}.geo.json

# Convert from Shapefile to TopoJSON
# @alias: convert2geojson
# @format: GEOJSON
app/scripts/${dataFile}.geo.json:
	@printf "Converting…\n\tShapefile → GeoJSON\n"
	@ogr2ogr \
		-f GeoJSON $@ \
		.tmp/${dataFile}/*.shp


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
.tmp/${dataFile}.shp.zip:
	@printf "Fetching…\n\tEmplacements d'apport volontaire de la CUB data\n"
	@curl --output $@ 'http://data.lacub.fr/files.php?gid=69&format=1'


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
	yo gulp-webapp
	bower install --save polymaps topojson font-awesome d3 d3-plugins
