//For working in localDev
var url = "https://adobeaero.app.link/vptrfaazXlb/";

var delayCreateScene = function () {
    // Create a scene.
    var scene = new BABYLON.Scene(engine);
    
    // Append Aero experience to scene.
    //BABYLON.SceneLoader.ImportMesh("https://adobeaero.app.link/fYlRS5HDEjb", "", "", scene, () => { //Music
    //BABYLON.SceneLoader.ImportMesh("https://adobeaero.app.link/hjr2kREailb", "", "", scene, () => { //Lander Prototype
    //BABYLON.SceneLoader.ImportMesh("https://adobeaero.app.link/x9mVrUVQrlb", "", "", scene, () => { //Lander 2 (Image Anchor)
    //BABYLON.SceneLoader.ImportMesh("https://adobeaero.app.link/VTdzjQWfslb", "", "", scene, () => { //Landin Pad 1
    BABYLON.SceneLoader.ImportMeshAsync(null, url, "",scene, (progressObject) => {
        //Progress
        if(!progressObject.lengthComputable) {
            console.log("Waiting...");
        } else {
            var progress = Math.round(100*progressObject.loaded/progressObject.total);
            console.log("Progress: " + progress + " done");
            // Create a default arc rotate camera and light.
            scene.createDefaultCamera(true, true, true);
            // The default camera looks at the back of the asset.
            // Rotate the camera by 180 degrees to the front of the asset.
            scene.activeCamera.alpha += Math.PI;
            // Register a render loop to repeatedly render the scene
            engine.runRenderLoop(function () {
                    scene.render();
            });
        }
    }, ".aero");

    return scene;
};
