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

##External Libraries

- jQuery 2.2.0: http://code.jquery.com/jquery-2.2.0.min.js
- jQuery Nanoscroller 0.8.7: https://raw.githubusercontent.com/jamesflorentino/nanoScrollerJS/master/bin/javascripts/jquery.nanoscroller.min.js  
  The link points to the latest version. this might change between the release of a new Skynet version
  and the review by the AMO editors.
- jQuery UI 1.11.4:
  This is a custom build.  
  To review this version open the following link: http://jqueryui.com/themeroller/?ffDefault=Verdana%2C%20sans&fwDefault=bold&fsDefault=11px&cornerRadius=6px&bgColorHeader=333333&bgTextureHeader=gloss_wave&bgImgOpacityHeader=25&borderColorHeader=333333&fcHeader=ffffff&iconColorHeader=ffffff&bgColorContent=000000&bgTextureContent=inset_soft&bgImgOpacityContent=25&borderColorContent=666666&fcContent=ffffff&iconColorContent=cccccc&bgColorDefault=555555&bgTextureDefault=glass&bgImgOpacityDefault=20&borderColorDefault=666666&fcDefault=eeeeee&iconColorDefault=cccccc&bgColorHover=0078a3&bgTextureHover=glass&bgImgOpacityHover=40&borderColorHover=59b4d4&fcHover=ffffff&iconColorHover=ffffff&bgColorActive=444444&bgTextureActive=glass&bgImgOpacityActive=30&borderColorActive=555555&fcActive=ffffff&iconColorActive=222222&bgColorHighlight=eeeeee&bgTextureHighlight=highlight_soft&bgImgOpacityHighlight=80&borderColorHighlight=cccccc&fcHighlight=2e7db2&iconColorHighlight=4b8e0b&bgColorError=ffc73d&bgTextureError=glass&bgImgOpacityError=40&borderColorError=ffb73d&fcError=111111&iconColorError=a83300&bgColorOverlay=5c5c5c&bgTextureOverlay=flat&bgImgOpacityOverlay=50&opacityOverlay=80&bgColorShadow=cccccc&bgTextureShadow=flat&bgImgOpacityShadow=30&opacityShadow=60&thicknessShadow=7px&offsetTopShadow=-7px&offsetLeftShadow=-7px&cornerRadiusShadow=8px&ctl=themeroller  
  It will open the official ThemeRoller of jQuery UI.  
  Click the orange **Download theme** Button.  
  Now uncheck the **Toggle All** checkbox.  
  In the Widgets Section please check:
    - Accordion
    - Button
    - Dialog
    - Tabs
    - Tooltip
  Now add `.skynet` as **CSS Scope**

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