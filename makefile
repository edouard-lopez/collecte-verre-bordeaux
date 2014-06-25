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
get-emplacements: .tmp/${dataFile}.shp.zip
extract-emplacements: .tmp/${dataFile}.shp

# Download Emplacements d'apport volontaire de la CUB
# @alias: get-emplacements
# @source: http://catalogue.datalocale.fr/dataset/en_empac_p
# @format: Zip
.tmp/${dataFile}.shp.zip:
	@printf "Fetching...\n\tEmplacements d'apport volontaire de la CUB data\n"
	@curl --output $@ 'http://data.lacub.fr/files.php?gid=69&format=1'


# Create .tmp/ directory if needed
.tmp:
	[[ ! -d .tmp ]] && mkdir .tmp


# Install tooling and library
install:
	@printf "Installing system-wide (Ubuntu)...\n"
	sudo apt-get -y install gdal-{bin,contrib}
	sudo npm install -g topojson underscore gulp generator-gulp-webapp
	@printf "Install project-wide (Ubuntu)...\n"
	npm install --save-dev topojson generator-leaflet underscore gulp
	yo gulp-webapp
	bower install --save polymaps topojson font-awesome d3 d3-plugins
