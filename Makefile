PATH := ${PWD}/node_modules/.bin:${PWD}/browser/node_modules/.bin:${PATH} 
SHELL := env PATH=${PATH} ${SHELL}

all: live

browser: depends
	./browser/electron.js

cli: modules
	./cli/headless.js

generate: modules
	./scripts/generate-data.js

bundle: depends
	./scripts/generate-bundle.js

.PHONY: depends modules browser
depends: modules browser_modules
modules: node_modules
browser_modules: browser/bower_components

node_modules:
	npm install

browser/bower_components: browser/node_modules
	bower install

browser/node_modules:
	npm --prefix=browser install

clean:
	git clean -Xfd
