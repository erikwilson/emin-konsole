PATH := ${PWD}/node_modules/.bin:${PATH} 
SHELL := env PATH=${PATH} ${SHELL}

all: live

electron: depends
	./scripts/electron.js

headless: modules
	./scripts/headless.js

generate: modules
	./scripts/generate-data.js

bundle: depends
	./scripts/generate-bundle.js

.PHONY: depends modules browser
depends: modules browser
modules: node_modules
browser: browser/bower_components

node_modules:
	npm install

browser/bower_components:
	bower install

clean:
	git clean -Xfd
