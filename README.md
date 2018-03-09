# Skynet #

To whom it may concern.

The Skynet project folder has a specific structure to support simultaneous extension development
for Chrome and Firefox.
The build system is [Gulp][gulp].

## Structure ##

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

To install all dependencies use: `npm install`

In Addition Gulp-CLI should be installed globally: `npm i -g gulp-cli`

With Gulp default task, the whole extension is build for Chrome and Firefox: `gulp`

The destination directory is **dist**.

###Firefox XPI

To test with Firefox the following settings are suggested (about:config).

	xpinstall.signatures.required: false
	extensions.jid1-j57LkwpAWjGJXw@jetpack.sdk.console.logLevel: info

After switching to the build/firefox folder, you can use `jpm xpi` to create the Firefox addon.

The file has a cryptic name. Please rename it to match the correct name.

The checksum of the XPI package can not be used. The XPI generated under Windows 10 using JPM 1.0.4 is different to the XPI from Linux Mint 17.3.  
The content of both files is equal.  
**Conclusion**: To check if the provided source fits to the uglified result, compare the contents of the XPI.

The addon can be tested on page: http://pioneers.en.ogame.gameforge.com/  
Choose universe **Bermuda**  
Username **Skynet**  
Passwort: huxi54-Turta

## External Libraries ##

 - [jQuery v3.3.1][jquery]

 - [jQuery UI - v1.12.1][jqueryui]  
    This is a custom build. To review this version open the provided link. It will open the official
    ThemeRoller of jQuery UI.  
    Click the orange **Download theme** Button.  
    Now uncheck the **Toggle All** checkbox.  
    In the Widgets Section please check:
    - Accordion
    - Button
    - Dialog
    - Tabs
    - Tooltip
    
    Now add `.skynet` as **CSS Scope** and download the custom theme for Skynet.
    
    The files used by Skynet have a new timestamp with every download!

 - [Knockout JavaScript library v3.4.2][knockout]
 
 - [nanoScrollerJS - v0.8.7][nanoscroller]  
    The zip file contains the same minified version like this addon.

[gulp]: https://github.com/gulpjs/gulp
[jquery]: https://code.jquery.com/jquery-3.3.1.slim.min.js
[jqueryui]: http://jqueryui.com/themeroller/?scope=.skynet&folderName=skynet&ctl=themeroller&bgImgOpacityError=40&bgImgOpacityHighlight=80&bgImgOpacityActive=30&bgImgOpacityHover=40&bgImgOpacityDefault=20&bgImgOpacityContent=25&bgImgOpacityHeader=25&cornerRadiusShadow=8px&offsetLeftShadow=-7px&offsetTopShadow=-7px&thicknessShadow=7px&opacityShadow=60&bgImgOpacityShadow=30&bgTextureShadow=flat&bgColorShadow=cccccc&opacityOverlay=80&bgImgOpacityOverlay=50&bgTextureOverlay=flat&bgColorOverlay=5c5c5c&iconColorError=a83300&fcError=111111&borderColorError=ffb73d&bgTextureError=glass&bgColorError=ffc73d&iconColorHighlight=4b8e0b&fcHighlight=2e7db2&borderColorHighlight=cccccc&bgTextureHighlight=highlight_soft&bgColorHighlight=eeeeee&iconColorActive=222222&fcActive=ffffff&borderColorActive=555555&bgTextureActive=glass&bgColorActive=444444&iconColorHover=ffffff&fcHover=ffffff&borderColorHover=59b4d4&bgTextureHover=glass&bgColorHover=0078a3&iconColorDefault=cccccc&fcDefault=eeeeee&borderColorDefault=666666&bgTextureDefault=glass&bgColorDefault=555555&iconColorContent=cccccc&fcContent=ffffff&borderColorContent=666666&bgTextureContent=inset_soft&bgColorContent=000000&iconColorHeader=ffffff&fcHeader=ffffff&borderColorHeader=333333&bgTextureHeader=gloss_wave&bgColorHeader=333333&cornerRadius=6px&fwDefault=bold&fsDefault=11px&ffDefault=Verdana%2C%20sans
[knockout]: http://knockoutjs.com/downloads/knockout-3.4.2.js
[mocha]: https://mochajs.org/
[nanoscroller]: https://github.com/jamesflorentino/nanoScrollerJS/releases/tag/0.8.7
