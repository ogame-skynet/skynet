#Skynet

To whom it may concern.

The Skynet project folder has a specific structure to support simultaneous extension development
for Chrome and Firefox.  
The build system is Gulp.

##Structure

- src: all source code
    - css: Cascading style sheets
    - ext: External resources like jQuery, jQuery UI and Knockout
    - gfx: Graphics
    - i18n: Translations
    - js: JavaScript resources
        - backend: used in the background of the extension
            - chrome: Chrome specific scripts
            - firefox: Firefox specific scripts
        - common: used both in the background and the content scripts
        - content: content script usage only
            - chrome: Chrome specific scripts
            - firefox: Firefox specific scripts
    - templates: HTML templates used by the extension

##Gulp

The first lines of the **gulpfile.js** define all the dependencies for the Gulp build system.

To install all dependencies use:

	npm install gulp@3.9.0 gulp-util@3.0.7 gulp-notify@2.2.0 gulp-concat@2.6.0 gulp-jshint@2.0.0 gulp-uglify@1.5.1 del@2.2.0 gulp-json-transform@0.3.0 gulp-rename@1.2.2 gulp-shell@0.5.1 gulp-wait@0.0.2 gulp-order@1.1.1 gulp-if@2.0.0 merge-stream@1.0.0 jpm@1.0.4

Then you can call gulp to build the final source code for firefox or chrome.

After switching to the build/firefox folder, you can use jpm xpi to create the Firefox addon.

The file has a cryptic name. Please rename it to match the correct name.

The current version used for the actual build can be seen in the **versions.npm**.  
This file is a result of the command `npm list > versions.npm`.

Updating all Gulp packages can be done by `sudo npm update -g`.  

With Gulp default task, the whole extension is build for Chrome and Firefox.  
The destination directory is **build**.

###Firefox XPI

In order to meet a requirement of the AMO Editors, the **jquery-ui.min.js** (100kB) that is used
for Chrome and Firefox (previously), will be replaced by the full **jquery-ui.min.js** (240kB) prior
to building the XPI package.

The checksum of the XPI package is created using `sha256sum skynet.file.xpi`.

The addon can be tested on page: http://pioneers.en.ogame.gameforge.com/  
Choose universe **Bermuda**  
Username **Skynet**  
Passwort: huxi54-Turta