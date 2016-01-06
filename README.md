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

To install all dependencies use: `npm install`

With Gulp default task, the whole extension is build for Chrome and Firefox: `gulp`

The destination directory is **build**.

###Firefox XPI

In order to meet a requirement of the AMO Editors, the **jquery-ui.min.js** (100kB) that is used
for Chrome and Firefox (previously), will be replaced by the full **jquery-ui.min.js** (240kB) prior
to building the XPI package.

After switching to the build/firefox folder, you can use `jpm xpi` to create the Firefox addon.

The file has a cryptic name. Please rename it to match the correct name.

The checksum of the XPI package is created using `sha256sum skynet.file.xpi`.

The addon can be tested on page: http://pioneers.en.ogame.gameforge.com/  
Choose universe **Bermuda**  
Username **Skynet**  
Passwort: huxi54-Turta