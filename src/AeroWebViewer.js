//@version 1
/*

A no-op to trigger Desktop to use web for preview and for the back end to give a web viewer

*/

if(typeof __filename === "undefined") {
    //If we are in babylon, track down the RTM object
    //We can use the first anchor in the first scene because RTM is static
    babylonScene = engine.scenes[0];
    anchor = babylonScene.getNodeByName("Ag_Anchor");
    RTM = anchor.aeroScene.GetRTM();
}

var webViewerAction = new RTM.Action();
webViewerAction.setName('AeroWebViewer');
webViewerAction.property('JSON').setString("Empty");
webViewerAction.insideAero = true;
if(typeof __filename === "undefined") {
    webViewerAction.insideAero = false;
};
webViewerAction.setOnStart(function(action){
    var result = new Object();
    result.status = "done";
    return result;
});
webViewerAction.setOnUpdate(function(action){
    var result = new Object();
    result.status = "done";
    return result;
});

RTM.scene.addActionPrototype(webViewerAction);

if(webViewerAction.insideAero) {
    RTM.application.watchFileForReload(__filename);
    RTM.application.registerScriptAction('AeroWebViewer', __filename);
    logger.info("This scene is built for the Aero Web Viewer")
} else {

}
