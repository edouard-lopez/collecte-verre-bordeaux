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


.PHONY: default
default:

