# Skynet #

To whom it may concern.

The Skynet project folder has a specific structure to support simultaneous extension development
for Chrome and Firefox.

## Structure ##

    skynet /
    ├── dist /
    │   ├── chrome /            : Chrome distribution
    │   ├── chrome_legacy /     : Chrome distribution with legacy code
    │   └── firefox /           : Firefox distribution
    ├── legacy /                : old code that is not yet migrated
    │   ├── css /               : Cascading style sheets
    │   ├── ext /               : External resources like jQuery, jQuery UI and Knockout
    │   ├── js /                : JavaScript resources
    │   │   ├── backend /       : used in the background of the extension
    │   │   │   ├── chrome /    : Chrome specific scripts
    │   │   │   └── firefox /   : Firefox specific scripts
    │   │   ├── common /        : used both in the background and the content scripts
    │   │   └── content /       : content script usage only
    │   │       ├── chrome /    : Chrome specific scripts
    │   │       └── firefox /   : Firefox specific scripts
    │   └── templates /         : HTML templates used by the extension
    └── src /                   : refactored and new code
    │   └── main /
    │       ├── js /            : JavaScript ECMAScript 2015, 2016, 2017
    │       └── resources /     : Resources like images, locales and the manifest template
    └── tasks /                 : Gulp tasks for the build system
    

## Usage

The build system is [Node.js][nodejs] based.  
The use of [yarn] is recommended, but [npm] will work too.  
The build system uses [Gulp] and [webpack], as well as [ESlint] and [Babel],

To install all dependencies use: `yarn install`

The following lines are not yet correct. At the moment Skynet is built over the commandline with
the `gulp` command.

    As you can see, the package.json contains some hopefully self-explanatory tasks.
    These are started like this, for example: `yarn run build`

## Chrome

To test the extension in Chrome, you should have installed the
[Chrome Apps & Extensions Developer Tool][chrome-apps-extension].  
This is started separately.  
You can then load the extension from the Chrome dist folder using **Load unpacked**.

## Firefox

The [Developer Edition][Firefox Developer] is required for testing and developing with Firefox.
This usually creates a second profile so that the other extensions do not interfere.

With `about:debugging` you get to the page for managing the extensions. Here you should activate the debugging of
add-ons and can load add-ons temporarily.

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

[Babel]: http://babeljs.io/
[chrome-apps-extension]: https://chrome.google.com/webstore/detail/chrome-apps-extensions-de/ohmmkhmmmpcnpikjeljgnaoabkaalbgc
[ESlint]: https://eslint.org/
[Firefox Developer]: https://www.mozilla.org/de/firefox/developer/
[Gulp]: https://github.com/gulpjs/gulp
[jquery]: https://code.jquery.com/jquery-3.3.1.min.js
[jqueryui]: http://jqueryui.com/themeroller/?scope=.skynet&folderName=skynet&ctl=themeroller&bgImgOpacityError=40&bgImgOpacityHighlight=80&bgImgOpacityActive=30&bgImgOpacityHover=40&bgImgOpacityDefault=20&bgImgOpacityContent=25&bgImgOpacityHeader=25&cornerRadiusShadow=8px&offsetLeftShadow=-7px&offsetTopShadow=-7px&thicknessShadow=7px&opacityShadow=60&bgImgOpacityShadow=30&bgTextureShadow=flat&bgColorShadow=cccccc&opacityOverlay=80&bgImgOpacityOverlay=50&bgTextureOverlay=flat&bgColorOverlay=5c5c5c&iconColorError=a83300&fcError=111111&borderColorError=ffb73d&bgTextureError=glass&bgColorError=ffc73d&iconColorHighlight=4b8e0b&fcHighlight=2e7db2&borderColorHighlight=cccccc&bgTextureHighlight=highlight_soft&bgColorHighlight=eeeeee&iconColorActive=222222&fcActive=ffffff&borderColorActive=555555&bgTextureActive=glass&bgColorActive=444444&iconColorHover=ffffff&fcHover=ffffff&borderColorHover=59b4d4&bgTextureHover=glass&bgColorHover=0078a3&iconColorDefault=cccccc&fcDefault=eeeeee&borderColorDefault=666666&bgTextureDefault=glass&bgColorDefault=555555&iconColorContent=cccccc&fcContent=ffffff&borderColorContent=666666&bgTextureContent=inset_soft&bgColorContent=000000&iconColorHeader=ffffff&fcHeader=ffffff&borderColorHeader=333333&bgTextureHeader=gloss_wave&bgColorHeader=333333&cornerRadius=6px&fwDefault=bold&fsDefault=11px&ffDefault=Verdana%2C%20sans
[knockout]: http://knockoutjs.com/downloads/knockout-3.4.2.js
[mocha]: https://mochajs.org/
[nanoscroller]: https://github.com/jamesflorentino/nanoScrollerJS/releases/tag/0.8.7
[nodejs]: https://nodejs.org/en/
[npm]: https://www.npmjs.com/get-npm
[webpack]: https://webpack.js.org/
[yarn]: https://yarnpkg.com/lang/en/
