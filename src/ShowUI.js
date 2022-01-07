//@version 1
/*

ShowUI.js - UI loader

WASM->JS Callbacks
- UpdateAction(action) => {"status": "running, done" }
- StartAction(action) => {"status": "running, done" }

*/

var gUIElements = new Object();
var advancedTexture = null;


if(typeof __filename === "undefined") {
    //If we are in babylon, track down the RTM object
    //We can use the first anchor in the first scene because RTM is static
    aeroScene= engine.scenes[0].getNodeByName("Ag_Anchor").aeroScene;
    RTM = aeroScene.GetRTM();
}

var showUIAction = new RTM.Action();
showUIAction.setName('ShowUI');
showUIAction.property('JSON').setString("Empty");
showUIAction.property('Name').setString("Optional");
showUIAction.insideAero = true;
if(typeof __filename === "undefined") {
    showUIAction.insideAero = false;
};

showUIAction.setOnStart(function(action){
    //See Show UI
    var result = new Object();
    if(action.JSON == undefined || action.JSON == "") {
        result.status = "done";
        return result;
    }
    if(showUIAction.insideAero) {
        //Can't do UI in Aero
        result.status = "done";
    } else {
        var jsonString = unescape(action.JSON);
        //console.log(jsonString);
        if(jsonString[0] == '{' || jsonString[0] == '[') {
            for (const [key, value] of Object.entries(gUIElements)) {
                advancedTexture.removeControl(value);
            }
            var uiObject = JSON.parse(jsonString);
            BuildAeroUI(uiObject);
        } else {
            if(typeof gUIElements[action.JSON] !== 'undefined') {
                gUIElements[action.JSON].isVisible = true;
            }
        }
        result.status = "running";
    }
    return result;
});

showUIAction.setOnUpdate(function(action){
    var result = new Object();
    if(showUIAction.insideAero) {
        //Can't do UI in Aero
        result.status = "done";
    } else {
        //Idle the UI
        result.status = "done";
    }
    return result;
});

RTM.scene.addActionPrototype(showUIAction);

function BuildAeroUI(uiObject) {
    if(!advancedTexture) {
       advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    }
    var top =10000;
    var bottom = 0;
    var left = 10000;
    var right = 0;
    
    for (var i = 0; i < uiObject.length; i++) {
        if(uiObject[i].bounds.top < top)
            top = uiObject[i].bounds.top;
        if(uiObject[i].bounds.left < left)
            left = uiObject[i].bounds.left;
        if(uiObject[i].bounds.right > right)
            right = uiObject[i].bounds.right;
        if(uiObject[i].bounds.bottom > bottom)
            bottom = uiObject[i].bounds.bottom;
    }
    var uiWidth = right-left;
    var uiHeight = bottom-top;
    advancedTexture.idealWidth = uiWidth;
    advancedTexture.idealHeight = uiHeight;
    //var scaleH = window.innerWidth/uiWidth;
    var scaleV = window.innerHeight/uiHeight;

    for (var i = 0;i<uiObject.length; i ++) {
        var element = uiObject[i];
        var uiElement;
        var unit = "px";
        var divisorW = 1;//uiWidth*0.01;
        var divisorH = 1;//uiHeight*0.01;
        var uiPrecision = 1000;

        var width = Math.round(uiPrecision*(element.bounds.right-element.bounds.left)/divisorW)/uiPrecision;
        var height = Math.round(uiPrecision*(element.bounds.bottom-element.bounds.top)/divisorH)/uiPrecision;

        var leftOffset = Math.round(uiPrecision*(element.bounds.left - left)/divisorW)/uiPrecision;
        var rightOffset = Math.round(-uiPrecision*(right - element.bounds.right)/divisorW)/uiPrecision;
        var topOffset = Math.round(uiPrecision*(element.bounds.top - top)/divisorH)/uiPrecision;
        var bottomOffset = Math.round(-uiPrecision*(bottom - element.bounds.bottom)/divisorH)/uiPrecision;
        var centerHOffset = Math.round(uiPrecision*(((element.bounds.right+element.bounds.left)/2) - ((right+left)/2) ) /divisorW)/uiPrecision;
        var centerVOffset = Math.round(-uiPrecision*( ((bottom+top)/2) - ((element.bounds.bottom+element.bounds.top)/2))/divisorH)/uiPrecision;

        if (element.kind == "IMAGE") {
            uiElement = BABYLON.GUI.Button.CreateImageOnlyButton(element.name, element.url);
            uiElement.zIndex = 4;
            uiElement.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM;
            uiElement.onPointerDownObservable.add((eventData, state) => {
                //Fire custom event - state.currentTarget.name
                aeroScene.RaiseCustomEvent(state.currentTarget.name + " Down");
            });
            uiElement.onPointerUpObservable.add((eventData, state) => {
                //Fire up event - state.currentTarget.name
                aeroScene.RaiseCustomEvent(state.currentTarget.name + " Up");
            });

        } else if (element.kind == "TEXT") {
            element.text = element.text.replace(/\r/g,"\n");
            uiElement = new BABYLON.GUI.TextBlock(element.name + " Text", element.text);

            uiElement.zIndex = 3;
            uiElement.textWrapping = false;
            var fontSize = parseInt(element.fontSize.split(" ")[0]);

            uiElement.fontSize = fontSize + " pt";
            uiElement.color = "rgb(" + element.color.red + "," + element.color.green + "," +element.color.blue + ")";
            uiElement.background = "transparent";
            uiElement.lineSpacing = "8px";

            if(element.align == "RIGHT")
                uiElement.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
            else if(element.align == "HORIZONTAL_CENTER")
                uiElement.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            else
                uiElement.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;

            uiElement.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;

        } else if (element.kind == "SOLIDFILL") {
            uiElement = new BABYLON.GUI.Rectangle();
            uiElement.color = "rgb(" + element.color.red + "," + element.color.green + "," +element.color.blue + ")";
            uiElement.background = "rgb(" + element.color.red + "," + element.color.green + "," +element.color.blue + ")";

            uiElement.zIndex = 2;
        } else if (element.kind == "TEXTINPUT") {
            var uiElement = new BABYLON.GUI.InputText();
            uiElement.text = "";
            uiElement.color = "rgb(" + element.color.red + "," + element.color.green + "," +element.color.blue + ")";
            uiElement.focusedColor = "red";
            uiElement.textHighlightColor = "blue";
            uiElement.background = "transparent";
            uiElement.focusedBackground = "transparent";
            uiElement.zIndex = 4;
        } else if(element.kind == "SLIDER") {
            var uiElement = new BABYLON.GUI.ImageBasedSlider();
            uiElement.minimum = 0;
            uiElement.maximum = 100;
            uiElement.value = 0;

            uiElement.backgroundImage = new BABYLON.GUI.Image("back", element.background);
            uiElement.backgroundImage.stretch = BABYLON.GUI.Image.STRETCH_NONE;
            uiElement.valueBarImage = new BABYLON.GUI.Image("value", element.value);
            uiElement.valueBarImage.stretch = BABYLON.GUI.Image.STRETCH_NONE;
            uiElement.thumbImage = new BABYLON.GUI.Image("thumb", element.thumb);
            uiElement.thumbImage.stretch = BABYLON.GUI.Image.STRETCH_NONE;
            uiElement.zIndex = 4;
            uiElement.isPointerBlocker = true;
            uiElement.isThumbClamped = true;

            width = Math.round(uiPrecision*(element.backgroundBounds.right-element.backgroundBounds.left)/divisorW)/uiPrecision;
            height = Math.round(uiPrecision*(element.backgroundBounds.bottom-element.backgroundBounds.top)/divisorH)/uiPrecision;
    
            leftOffset = Math.round(uiPrecision*(element.backgroundBounds.left - left)/divisorW)/uiPrecision;
            rightOffset = Math.round(-uiPrecision*(right - element.backgroundBounds.right)/divisorW)/uiPrecision;
            topOffset = Math.round(uiPrecision*(element.backgroundBounds.top - top)/divisorH)/uiPrecision;
            bottomOffset = Math.round(-uiPrecision*(bottom - element.backgroundBounds.bottom)/divisorH)/uiPrecision;
            centerHOffset = Math.round(uiPrecision*(((element.backgroundBounds.right+element.backgroundBounds.left)/2) - ((right+left)/2) ) /divisorW)/uiPrecision;
            centerVOffset = Math.round(-uiPrecision*( ((bottom+top)/2) - ((element.backgroundBounds.bottom+element.backgroundBounds.top)/2))/divisorH)/uiPrecision;
            uiElement.onValueChangedObservable.add(function(value) {
                setTimeout(() => {
                    aeroScene.RaiseCustomEvent(state.currentTarget.name + " Changed");
                }, 0);
            });
        } else if (element.kind == "COLORPICKER") {
            uiElement = new BABYLON.GUI.Rectangle();
            //uiElement.color = new BABYLON.Color4(element.color.red/255,element.color.green/255,element.color.blue/255,1);
            //uiElement.background = "rgb(" + element.color.red + "," + element.color.green + "," +element.color.blue + ")";
            
            var uiElement = new BABYLON.GUI.ColorPicker();
            uiElement.value = new BABYLON.Color(1,1,1);
            uiElement.onValueChangedObservable.add(function(value) { // value is a color3
                setTimeout(() => {
                    aeroScene.RaiseCustomEvent(state.currentTarget.name + " Changed");
                }, 0);
            });
            uiElement.zIndex = 4;
        } 

        if(element.hAlign == "none") {
            uiElement.width = "100%";
        } else {
            uiElement.width = width.toString() + unit;
        }

        if(element.vAlign == "none") {
            uiElement.height = "100%";
        } else {
            uiElement.height = height.toString() + unit;
        }

        if (element.hAlign == "LEFT") {
            uiElement.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            uiElement.left = leftOffset.toString() + unit;
        } else if (element.hAlign == "RIGHT") {
            uiElement.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
            uiElement.left = rightOffset.toString() + unit;
        } else if (element.hAlign == "HORIZONTAL_CENTER") {
            uiElement.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            uiElement.left = centerHOffset.toString() + unit;
        }

        if (element.vAlign == "TOP") {
            uiElement.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
            uiElement.top = topOffset.toString() + unit;
        } else if (element.vAlign == "BOTTOM") {
            uiElement.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
            uiElement.top = bottomOffset.toString() + unit;
        } else if (element.vAlign == "VERTICAL_CENTER") {
            uiElement.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
            uiElement.top = centerVOffset.toString() + unit;
        }
        uiElement.clipContent=false;
        uiElement.clipChildren=false;
        uiElement.alpha=element.alpha/100;
        advancedTexture.addControl(uiElement);
        gUIElements[element.name] = uiElement;

    }
}

if(showUIAction.insideAero) {
    RTM.application.watchFileForReload(__filename);
    RTM.application.registerScriptAction('ShowUI', __filename);
    logger.info("[*** AAF ***] ShowUI user action loaded");
} else {
    console.log("UI custom behavior loaded");
}


/*

HideUI

*/

var hideUIAction = new RTM.Action();
hideUIAction.setName('HideUI');
hideUIAction.property('ElementName').setString("All");
hideUIAction.insideAero = true;
if(typeof __filename === "undefined") {
    hideUIAction.insideAero = false;
};

hideUIAction.setOnStart(function(action){
    //See Show UI
    var result = new Object();
    if(hideUIAction.insideAero) {
        //Can't do UI in Aero
        result.status = "done";
    } else {
        result.status = "done";
        if(action.ElementName == "All" || action.ElementName == undefined) {
            if(!advancedTexture)
                return results;

            for (const [key, value] of Object.entries(gUIElements)) {
                advancedTexture.removeControl(value);
            }
            gUIElements = new Object();
        } else {
            if(typeof gUIElements[action.ElementName] !== 'undefined') {
                gUIElements[action.ElementName].isVisible = false;
            }
        }
    }
    return result;
});
hideUIAction.setOnUpdate(function(action){
    var result = new Object();
    result.status = "done";
    return result;
});

RTM.scene.addActionPrototype(hideUIAction);
