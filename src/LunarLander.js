//@version 1
/*

LunarLander

*/

var webXRAvailable=false;
if(typeof __filename === "undefined") {
    //If we are in babylon, track down the RTM object
    //We can use the first anchor in the first scene because RTM is static
    babylonScene= engine.scenes[0];
    aeroScene= babylonScene.getNodeByName("Ag_Anchor").aeroScene;
    RTM = aeroScene.GetRTM();
}


var spaceCraft;
var rcsActive = false;
var stabilizing = false;
var engine_firing = false;
var particleSystem;
var lensFlareSystem;
var engineLight;

var av_rotate_left;
var av_rotate_right;
var av_rotate_up;
var av_rotate_down;
var av_stop_rotating;
var av_rotate_around;

var RCSyawPosParticleSystem1;
var RCSyawPosParticleSystem2;
var RCSyawNegParticleSystem1;
var RCSyawNegParticleSystem2;
var RCSpitchPosParticleSystem1;
var RCSpitchPosParticleSystem2;
var RCSpitchNegParticleSystem1;
var RCSpitchNegParticleSystem2;

var lunarLanderAction = new RTM.Action();
lunarLanderAction.setName('LunarLander');
lunarLanderAction.property('GameEvent').setString("StartGame");
lunarLanderAction.insideAero = true;
if(typeof __filename === "undefined") {
    lunarLanderAction.insideAero = false;
};

lunarLanderAction.setOnStart(function(action){
    //See Show UI
    var result = new Object();
    if(lunarLanderAction.insideAero) {
        //Can't do UI in Aero
        result.status = "done";
    } else {
        if(action.GameEvent == "StartGame" || action.GameEvent == undefined) {
            WebXRAvailable();
        } else if(action.GameEvent == "PlayiOSAR") {
            webXRAvailable = true;
            aeroScene.EnterARModeiOS();
        } else if(action.GameEvent == "LaunchAero") {
            var url = aeroScene.GetPublishURL() + "?landing=" + escape(window.location);
            window.location = url;
        } else if (action.GameEvent == "Left Button Down") {
            spaceCraft.computeWorldMatrix()
            setRCS(true, true);
        }
        else if (action.GameEvent == "Right Button Down") {
            spaceCraft.computeWorldMatrix()
            setRCS(true, false);
        } 
        else if (action.GameEvent == "Up Button Down") {
            spaceCraft.computeWorldMatrix()
            setRCS(false, true);
        }
        else if (action.GameEvent == "Down Button Down") {
            spaceCraft.computeWorldMatrix()
            setRCS(false, false);
        }
        else if (action.GameEvent == "Stabilize Button Down") {
            stabilizing = true;
            rcsActive = true;
            // set rotation to point toward retrograde (with animation)
        }
        else if (action.GameEvent == "Thrust Button Down") {
            engine_firing = true;
            particleSystem.start();
            lensFlareSystem.isEnabled = true;
            engineLight.setEnabled(true);
        }
        else if (action.GameEvent == "Up Button Up" || 
                action.GameEvent == "Down Button Up" || 
                action.GameEvent == "Left Button Up" || 
                action.GameEvent == "Right Button Up" || 
                action.GameEvent == "Stabilize Button Up") {
            if(!spaceCraft)
                return;
            if(!spaceCraft.physicsImpostor)
                return;  
            spaceCraft.physicsImpostor.setAngularVelocity(av_stop_rotating);
            unsetRCS();
            if (action.GameEvent == "Stabilize Button Up") {
                rcsActive = false;
                stabilizing = false;
            }
        } else if (action.GameEvent == "Thrust Button Up") {
            engine_firing = false;
            particleSystem.stop();
            lensFlareSystem.isEnabled = false;
            engineLight.setEnabled(false);
        } else if (action.GameEvent == "Copy URL Button Down") {
            if(typeof navigator !== 'undefined')
                    navigator.clipboard.writeText('chrome://flags#webxr-incubations');
        }

        result.status = "done";
    }
    return result;
});
lunarLanderAction.setOnUpdate(function(action){
    var result = new Object();
    if(lunarLanderAction.insideAero) {
        //Can't do UI in Aero
        result.status = "done";
    } else {
        result.status = "done";
    }
    return result;
});

RTM.scene.addActionPrototype(lunarLanderAction);

if(lunarLanderAction.insideAero) {
    RTM.application.watchFileForReload(__filename);
    RTM.application.registerScriptAction('LunarLander', __filename);
    logger.info("[*** AAF ***] LunarLander user action loaded");
} else {
    console.log("LunarLander custom behavior loaded");
}

/*
Rocket ship stuff
*/

function setRCS(yaw, pos) {
    rcsActive = true;
    if (yaw) {
        if (pos) {
            spaceCraft.physicsImpostor.setAngularVelocity(BABYLON.Vector3.TransformNormal(av_rotate_left, spaceCraft.computeWorldMatrix()));
            RCSyawPosParticleSystem1.start();
            RCSyawPosParticleSystem2.start();
        }
        else {
            spaceCraft.physicsImpostor.setAngularVelocity(BABYLON.Vector3.TransformNormal(av_rotate_right, spaceCraft.computeWorldMatrix()));
            RCSyawNegParticleSystem1.start();
            RCSyawNegParticleSystem2.start();
        }
    }
    else {
        if (pos) {
            spaceCraft.physicsImpostor.setAngularVelocity(BABYLON.Vector3.TransformNormal(av_rotate_up, spaceCraft.computeWorldMatrix()));
            RCSpitchPosParticleSystem1.start();
            RCSpitchPosParticleSystem2.start();
        }
        else {
            spaceCraft.physicsImpostor.setAngularVelocity(BABYLON.Vector3.TransformNormal(av_rotate_down, spaceCraft.computeWorldMatrix()));
            RCSpitchNegParticleSystem1.start();
            RCSpitchNegParticleSystem2.start();
        }            
    }
}
function unsetRCS() {
    RCSyawPosParticleSystem1.stop();
    RCSyawPosParticleSystem2.stop();
    RCSyawNegParticleSystem1.stop();
    RCSyawNegParticleSystem2.stop();
    RCSpitchPosParticleSystem1.stop();
    RCSpitchPosParticleSystem2.stop();
    RCSpitchNegParticleSystem1.stop();
    RCSpitchNegParticleSystem2.stop();
    rcsActive = false;
}
function  WebXRAvailable() {
    var success=true;
    if(typeof navigator === 'undefined') {
        webXRAvailable = false;
        StartLunarLander();
        return false;
    }

    if(navigator.xr == undefined) {
        webXRAvailable = false;
        StartLunarLander();
        return false;
    }


    try {
        babylonScene.createDefaultXRExperienceAsync({
            uiOptions: {
                sessionMode: "immersive-ar",
                referenceSpaceType: "unbounded",
            },
            optionalFeatures: ['high-refresh-rate', "hit-test", "anchors", "plane-detection", "hand-tracking"]
        }).then((xrHelper) => {
            xrSession = xrHelper;
            // featuresManager from the base webxr experience helper
            const fm = xrSession.baseExperience.featuresManager;
            const sessionManager = xrSession.baseExperience.sessionManager;
                
            try {
                var planeDetector;
                planeDetector = fm.enableFeature(BABYLON.WebXRPlaneDetector.Name, "latest");
                planeDetector.dispose();
            } catch(e) {
                webXRAvailable = false;
                StartLunarLander();
                return;
            }

            try {
                // featuresManager from the base webxr experience helper
                var hitTesting;
                hitTesting = fm.enableFeature(BABYLON.WebXRHitTest.Name, "latest");
                hitTesting.paused = true;
                hitTesting.dispose();
            } catch(e) {
                webXRAvailable = false;
                StartLunarLander();
                return;
            }
            xrSession.dispose();
            delete xrSession;
            webXRAvailable = true;

            StartLunarLander();
        });
    } catch (e) {
        success = false;
        console.log("WebXR not supported");

        StartLunarLander();
    }
    return success;
}
function InsideIOSApp() {
    
    if (!window.hasOwnProperty("webkit")) {
        console.log("InsideIOSApp - no webkit");
        return false;
    }

    var webkit = window.webkit;

    if (!webkit.messageHandlers) {
        console.log("InsideIOSApp - no messageHandlers");
        return false;
    }
    if (!webkit.messageHandlers.aero) {
        console.log("InsideIOSApp - no aero object");
        return false;
    }

    console.log("InsideIOSApp - Success!");
        
    return true;
}
function DetectPlatform() {

    if(typeof navigator === 'undefined') {
        aeroScene.RaiseCustomEvent("Show Desktop Landing");
        return;
    }

    //Mac: 5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.55 Safari/537.36
    var OSName="Unknown OS";
    if (navigator.appVersion.indexOf("Win")!=-1) OSName="Windows";
    if (navigator.appVersion.indexOf("Mac")!=-1) OSName="MacOS";
    if (navigator.appVersion.indexOf("X11")!=-1) OSName="UNIX";
    if (navigator.appVersion.indexOf("Linux")!=-1) OSName="Linux";
    if (navigator.appVersion.indexOf("Android")!=-1) OSName="Android";
    if (navigator.appVersion.indexOf("iPhone")!=-1) OSName="iOS";
    if (navigator.appVersion.indexOf("iPad")!=-1) OSName="iOS";
//alert(OSName);
    if(OSName == "Android"){
        if(webXRAvailable)
            aeroScene.RaiseCustomEvent("Show Android Has XR Landing");
        else
            aeroScene.RaiseCustomEvent("Show Android No XR Landing");
    } else if(OSName == "iOS") {
        if(InsideIOSApp()) {
            aeroScene.RaiseCustomEvent("Show Android Has XR Landing");
        } else {
            aeroScene.RaiseCustomEvent("Show iOS Landing");
        }
    } else {
        aeroScene.RaiseCustomEvent("Show Desktop Landing");
    }
}

function StartLunarLander() {
    DetectPlatform();

    aeroScene.SetEnterARCallback( () => {
        aeroScene.RaiseCustomEvent("Enter AR");
    })

    aeroScene.SetExitARCallback( () => {
        aeroScene.RaiseCustomEvent("Exit AR");
    })

    var landerMesh = babylonScene.getNodeByName("ag_Lander");

    var gl = new BABYLON.GlowLayer("glow", babylonScene);
    var gravityVector = new BABYLON.Vector3(0,-9.81, 0);

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), babylonScene);
    spaceCraft = BABYLON.Mesh.CreateBox("box");
    spaceCraft.visibility = false;

    var spaceCraftPosition = new BABYLON.Vector3(0, 4, 0);


    spaceCraft.addChild(landerMesh);

    var physicsPlugin = new BABYLON.CannonJSPlugin();
    babylonScene.enablePhysics(BABYLON.Vector3.ZeroReadOnly, physicsPlugin);
    physicsPlugin.setGravity(gravityVector);



    gl.intensity = 1;

    const spaceCraftThrusterOffset = BABYLON.Mesh.CreateBox("thruster", 0.1);
    spaceCraftThrusterOffset.visibility = false;
    spaceCraftThrusterOffset.position = new BABYLON.Vector3(0,-1,0);
    spaceCraftThrusterOffset.parent = spaceCraft;

    const spaceCraftRCSThruster1 = BABYLON.Mesh.CreateBox("rcs1", 0.1);
    const spaceCraftRCSThruster2 = BABYLON.Mesh.CreateBox("rcs2", 0.1);
    const spaceCraftRCSThruster3 = BABYLON.Mesh.CreateBox("rcs3", 0.1);
    const spaceCraftRCSThruster4 = BABYLON.Mesh.CreateBox("rcs4", 0.1);
    // note, we should probably rotate the ship 45 degrees, instead of placing these at the diagonals
    spaceCraftRCSThruster1.position = new BABYLON.Vector3(-0.3, 0.4, 0);
    spaceCraftRCSThruster2.position = new BABYLON.Vector3(0.3, 0.4, 0);
    spaceCraftRCSThruster3.position = new BABYLON.Vector3(0, 0.4, -0.3);
    spaceCraftRCSThruster4.position = new BABYLON.Vector3(0, 0.4, 0.3);
    spaceCraftRCSThruster1.visibility = false;
    spaceCraftRCSThruster2.visibility = false;
    spaceCraftRCSThruster3.visibility = false;
    spaceCraftRCSThruster4.visibility = false;
    spaceCraftRCSThruster1.parent = spaceCraft;
    spaceCraftRCSThruster2.parent = spaceCraft;
    spaceCraftRCSThruster3.parent = spaceCraft;
    spaceCraftRCSThruster4.parent = spaceCraft;

    engineLight = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(0, -1, 0), babylonScene);
    var rcsLight1 = new BABYLON.PointLight("rcsLight1", new BABYLON.Vector3(0, 0, 0), babylonScene);
    var rcsLight2 = new BABYLON.PointLight("rcsLight2", new BABYLON.Vector3(0, 0, 0), babylonScene);
    var rcsLightParent1 = new BABYLON.TransformNode("rcsLighParent1", babylonScene);
    var rcsLightParent2 = new BABYLON.TransformNode("rcsLighParent1", babylonScene);
    engineLight.parent = spaceCraft;
    engineLight.intensity = 100;
    engineLight.setEnabled(false);
    rcsLightParent1.parent = spaceCraft;
    rcsLight1.parent = rcsLightParent1;
    rcsLight1.intensity = 4;
    rcsLightParent2.parent = spaceCraft;
    rcsLight2.parent = rcsLightParent2;
    rcsLight2.intensity = 4;

    spaceCraft.position = spaceCraftPosition;

    lensFlareSystem = new BABYLON.LensFlareSystem("lensFlareSystem", spaceCraftThrusterOffset, babylonScene);
    var flare00 = new BABYLON.LensFlare(
        0.1, // size
        0, // position
        new BABYLON.Color3(1, 1, 1), // color
        "textures/flare.png", // texture
        lensFlareSystem // lens flare system
    );
    var flare01 = new BABYLON.LensFlare(0.075, 0.5, new BABYLON.Color3(0.8, 0.56, 0.72), "textures/flare3.png", lensFlareSystem);
    var flare02 = new BABYLON.LensFlare(0.1, -0.15, new BABYLON.Color3(0.71, 0.8, 0.95), "textures/Flare2.png", lensFlareSystem);
    var flare03 = new BABYLON.LensFlare(0.15, 0.25, new BABYLON.Color3(0.95, 0.89, 0.71), "textures/flare.png", lensFlareSystem);
    lensFlareSystem.isEnabled = false;

    // Ground for positional reference
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 25, height: 25});
    ground.material = new BABYLON.GridMaterial("groundMat");
    ground.material.backFaceCulling = false;

    spaceCraft.physicsImpostor = new BABYLON.PhysicsImpostor(spaceCraft, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1, restitution: 0.4 }, babylonScene);
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, babylonScene);

    function setupRCSParticleSystem(ps, emitter,  direction) {
        ps.particleTexture = new BABYLON.Texture("textures/flare.png");
        ps.emitter = emitter;
        ps.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
        ps.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
        ps.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);
        ps.minEmitPower = 1;
        ps.maxEmitPower = 2;
        ps.minSize = 0.05;
        ps.maxSize = 0.1;
        ps.emitRate = 5000;
        ps.minLifeTime = 0.01;
        ps.maxLifeTime = 0.05;
        ps.direction1 = direction.scale(30);
        ps.direction2 = direction.scale(30);
        ps.minEmitBox = new BABYLON.Vector3(-0.05, -0.05, -0.05); // Starting all from
        ps.maxEmitBox = new BABYLON.Vector3(0.05, 0.05, 0.05); // To...
    }

    RCSyawPosParticleSystem1 = new BABYLON.ParticleSystem("rcsyawpos1", 2000);
    RCSyawPosParticleSystem2 = new BABYLON.ParticleSystem("rcsyawpos2", 2000);
    RCSyawNegParticleSystem1 = new BABYLON.ParticleSystem("rcsyawneg1", 2000);
    RCSyawNegParticleSystem2 = new BABYLON.ParticleSystem("rcsyawneg2", 2000);
    RCSpitchPosParticleSystem1 = new BABYLON.ParticleSystem("rcspitchpos1", 2000);
    RCSpitchPosParticleSystem2 = new BABYLON.ParticleSystem("rcspitchpos2", 2000);
    RCSpitchNegParticleSystem1 = new BABYLON.ParticleSystem("rcspitchneg1", 2000);
    RCSpitchNegParticleSystem2 = new BABYLON.ParticleSystem("rcspitchneg1", 2000);
    setupRCSParticleSystem(RCSyawPosParticleSystem1, spaceCraftRCSThruster1, new BABYLON.Vector3(0,1,0));
    setupRCSParticleSystem(RCSyawPosParticleSystem2, spaceCraftRCSThruster2, new BABYLON.Vector3(0,-1,0));
    setupRCSParticleSystem(RCSyawNegParticleSystem1, spaceCraftRCSThruster1, new BABYLON.Vector3(0,-1,0));
    setupRCSParticleSystem(RCSyawNegParticleSystem2, spaceCraftRCSThruster2, new BABYLON.Vector3(0,1,0));
    setupRCSParticleSystem(RCSpitchPosParticleSystem1, spaceCraftRCSThruster3, new BABYLON.Vector3(0,1,0));
    setupRCSParticleSystem(RCSpitchPosParticleSystem2, spaceCraftRCSThruster4, new BABYLON.Vector3(0,-1,0));
    setupRCSParticleSystem(RCSpitchNegParticleSystem1, spaceCraftRCSThruster3, new BABYLON.Vector3(0,-1,0));
    setupRCSParticleSystem(RCSpitchNegParticleSystem2, spaceCraftRCSThruster4, new BABYLON.Vector3(0,1,0));

    babylonScene.registerBeforeRender(function(){
        // set RCS lights to match particle effects
        if (RCSyawPosParticleSystem1.isStarted()) {
            rcsLightParent1.position.x = -1;
            rcsLightParent1.position.y = 0.5;
            rcsLightParent1.position.z = 0;
            rcsLightParent2.position.x = 1;
            rcsLightParent2.position.y = -0.5;
            rcsLightParent2.position.z = 0;
            rcsLight1.setEnabled(true);
            rcsLight2.setEnabled(true);
        }
        else if (RCSyawNegParticleSystem1.isStarted()) {
            rcsLightParent1.position.x = -1;
            rcsLightParent1.position.y = -0.5;
            rcsLightParent1.position.z = 0;
            rcsLightParent2.position.x = 1;
            rcsLightParent2.position.y = 0.5;
            rcsLightParent2.position.z = 0;
            rcsLight1.setEnabled(true);
            rcsLight2.setEnabled(true);
        }
        else if (RCSpitchPosParticleSystem1.isStarted()) {
            rcsLightParent1.position.x = 0;
            rcsLightParent1.position.y = 0.5;
            rcsLightParent1.position.z = 1;
            rcsLightParent2.position.x = 0;
            rcsLightParent2.position.y = -0.5;
            rcsLightParent2.position.z = -1;
            rcsLight1.setEnabled(true);
            rcsLight2.setEnabled(true);
        }
        else if (RCSpitchNegParticleSystem1.isStarted()) {
            rcsLightParent1.position.x = 0;
            rcsLightParent1.position.y = -0.5;
            rcsLightParent1.position.z = 1;
            rcsLightParent2.position.x = 0;
            rcsLightParent2.position.y = 0.5;
            rcsLightParent2.position.z = -1;
            rcsLight1.setEnabled(true);
            rcsLight2.setEnabled(true);
        }
        else {
            rcsLight1.setEnabled(false);
            rcsLight2.setEnabled(false);
        }
    });

    // Create a particle system
    particleSystem = new BABYLON.ParticleSystem("particles", 2000);

    //Texture of each particle
    particleSystem.particleTexture = new BABYLON.Texture("textures/flare.png");

    // Position where the particles are emiited from
    particleSystem.emitter = spaceCraftThrusterOffset;
    particleSystem.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
    particleSystem.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);
    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 2;
    particleSystem.minSize = 0.5;
    particleSystem.maxSize = 2;
    //    particleSystem.direction1 = new BABYLON.Vector3(-2, -16, -2);
    //    particleSystem.direction2 = new BABYLON.Vector3(2, -16, 2);
    this.angle = (180 / 360.0) * 2.0 * Math.PI;
    var angular_width = (10.0 / 360.0) * 2.0 * Math.PI;
    var recalculateDirections = function() {
    /*        direction = spaceCraftThrusterOffset.absolutePosition.subtract(spaceCraft.absolutePosition).scale(10);
        particleSystem.direction1 = direction;
        particleSystem.direction2 = direction;*/
        particleSystem.direction1 = new BABYLON.Vector3(
            Math.sin(this.angle+angular_width)*10,
            Math.cos(this.angle+angular_width)*10,
            Math.sin(angular_width)*10);
        particleSystem.direction2 = new BABYLON.Vector3(
            Math.sin(this.angle-angular_width)*10,
            Math.cos(this.angle-angular_width)*10,
            -Math.sin(angular_width)*10
        );
    }
    recalculateDirections();

    /*    particleSystem.direction1 = new BABYLON.Vector3(
        Math.sin(angle+angular_width),
        Math.cos(angle)*(-16),
        Math.sin(angle+angular_width)*(-2));
    particleSystem.direction2 = new BABYLON.Vector3(
        Math.sin(angle-angular_width),
        Math.cos(angle)*(-16),
        Math.sin(angle-angular_width));*/
    particleSystem.emitRate = 500;
    particleSystem.minLifeTime = 0.3;
    particleSystem.maxLifeTime = 1.5;

    particleSystem.updateFunction = function (particles) {
        for (var index = 0; index < particles.length; index++) {
            var particle = particles[index];
            particle.age += this._scaledUpdateSpeed;

            if (particle.age >= particle.lifeTime) {
                // Recycle
                particles.splice(index, 1);
                this._stockParticles.push(particle);
                index--;
                continue;
            } else {
                particle.colorStep.scaleToRef(this._scaledUpdateSpeed, this._scaledColorStep);
                particle.color.addInPlace(this._scaledColorStep);
                if (particle.color.a < 0) particle.color.a = 0;

                particle.angle += particle.angularSpeed * this._scaledUpdateSpeed;

                if (particle.position.y > 0 && particle.color.r != 0.2) {
                    particle.direction.scaleToRef(this._scaledUpdateSpeed, this._scaledDirection);
                    particle.position.addInPlace(this._scaledDirection);
                }
                else {
                    particle.direction.scaleToRef(this._scaledUpdateSpeed, this._scaledDirection);
                    particle.direction.y = 2;
                    particle.position.addInPlace(this._scaledDirection);
                    particle.color = new BABYLON.Color4(0.2, 0.2, 0.2, 1);                
                }
                this.gravity.scaleToRef(this._scaledUpdateSpeed, this._scaledGravity);
                particle.direction.addInPlace(this._scaledGravity);
            }
        }
    };

    av_rotate_left = new BABYLON.Vector3(0,0,1);
    av_rotate_right = new BABYLON.Vector3(0,0,-1);
    av_rotate_up = new BABYLON.Vector3(1,0,0);
    av_rotate_down = new BABYLON.Vector3(-1,0,0);
    av_stop_rotating = new BABYLON.Vector3(0,0,0);
    av_rotate_around = new BABYLON.Vector3(0,1,0);

    var face_camera_mode = true;
    var face_camera_strength = 5;
    var upright_mode = true;
    var upright_strength = 5;
        var vertical_speed = 0;

    spaceCraft.physicsImpostor.registerOnPhysicsCollide(ground.physicsImpostor, function(main, collided) {
        if (vertical_speed > 10) {
            // crash!
            spaceCraft.setEnabled(false);
    //	        spaceCraft.material.diffuseColor = new BABYLON.Color3(Math.random(), Math.random(), Math.random());
        }
    });

    // todo: detect crash --> split apart, detect successful landing
    window.addEventListener("keydown", (ev) => {
            if(!spaceCraft)
                return;
            if(!spaceCraft.physicsImpostor)
                return;  
                
            if (ev.code == "KeyA") {
                spaceCraft.computeWorldMatrix()
                setRCS(true, true);
            }
            if (ev.code == "KeyD") {
                spaceCraft.computeWorldMatrix()
                setRCS(true, false);
            } 
            if (ev.code == "KeyW") {
                spaceCraft.computeWorldMatrix()
                setRCS(false, true);
            }
            if (ev.code == "KeyX") {
                spaceCraft.computeWorldMatrix()
                setRCS(false, false);
            }
            if (ev.code == "KeyS") {
                stabilizing = true;
                rcsActive = true;
                // set rotation to point toward retrograde (with animation)
            }
            if (ev.code == "Space") {
                engine_firing = true;
                particleSystem.start();
                lensFlareSystem.isEnabled = true;
                engineLight.setEnabled(true);
            }
        });
    window.addEventListener("keyup", (ev) => {
        if (ev.code == "KeyA" || ev.code == "KeyD" || ev.code == "KeyW" || ev.code == "KeyX" || ev.code == "KeyS") {
            if(!spaceCraft)
                return;
            if(!spaceCraft.physicsImpostor)
                return;  
            spaceCraft.physicsImpostor.setAngularVelocity(av_stop_rotating);
            unsetRCS();
        }
        if (ev.code == "KeyS") {
            rcsActive = false;
            stabilizing = false;
        }
        if (ev.code == "Space") {
            engine_firing = false;
            particleSystem.stop();
            lensFlareSystem.isEnabled = false;
            engineLight.setEnabled(false);
        }
    });
    window.setInterval(() => {
        if (spaceCraft) {
            vertical_speed = -spaceCraft.physicsImpostor.getLinearVelocity().y;
        }
        if (!rcsActive) {
            // this should be an "easy mode" option -- keeps ship upright
            if(!spaceCraft)
                return;
            if(!spaceCraft.physicsImpostor)
                return;  

            var newAngularVelocity = new BABYLON.Vector3(0,0,0);
            if (face_camera_mode) {
                // this should be an "easy mode" option -- keeps a/d being screen ccw/cw and w being towards camera, x being away from camera
                var cameraToCraft = babylonScene.activeCamera.globalPosition.subtract(spaceCraft.absolutePosition).normalize();
                var craftFront = spaceCraftRCSThruster4.absolutePosition.subtract(spaceCraft.absolutePosition).normalize();
                var neededAngularVelocity = cameraToCraft.cross(craftFront);   
                neededAngularVelocity.x = 0;
                neededAngularVelocity.z = 0;
                neededAngularVelocity.y;
                if (neededAngularVelocity.lengthSquared() > 0.01) {
                    newAngularVelocity = neededAngularVelocity.scale(face_camera_strength);
                }
            }
            if (upright_mode) {
                var craft_up = spaceCraft.absolutePosition.subtract(spaceCraftThrusterOffset.absolutePosition).normalize();
                newAngularVelocity.addInPlace(craft_up.cross(BABYLON.Vector3.Up()).scale(upright_strength));
            }
            if (newAngularVelocity.lengthSquared() > 0) {
                spaceCraft.physicsImpostor.setAngularVelocity(newAngularVelocity);
            }
        }
        if (stabilizing) {
            if(!spaceCraft)
                return;
            if(!spaceCraft.physicsImpostor)
                return;  
            var forceDirection = spaceCraft.absolutePosition.subtract(spaceCraftThrusterOffset.absolutePosition).normalize();
            var angularVelocity = spaceCraft.physicsImpostor.getLinearVelocity().cross(forceDirection);
            spaceCraft.physicsImpostor.setAngularVelocity(angularVelocity);
            const min_thrust_effect = 0.1;
            if (BABYLON.Vector3.Dot(angularVelocity, av_rotate_down) > min_thrust_effect) {
                RCSpitchPosParticleSystem1.start();
                RCSpitchPosParticleSystem2.start();
            } else {
                RCSpitchPosParticleSystem1.stop();
                RCSpitchPosParticleSystem2.stop();
            }
            if (BABYLON.Vector3.Dot(angularVelocity, av_rotate_up) > min_thrust_effect) {
                RCSpitchNegParticleSystem1.start();
                RCSpitchNegParticleSystem2.start();
            } else {
                RCSpitchNegParticleSystem1.stop();
                RCSpitchNegParticleSystem2.stop();
            }
            if (BABYLON.Vector3.Dot(angularVelocity, av_rotate_left) > min_thrust_effect) {
                RCSyawPosParticleSystem1.start();
                RCSyawPosParticleSystem2.start();
            } else {
                RCSyawPosParticleSystem1.stop();
                RCSyawPosParticleSystem2.stop();
            }
            if (BABYLON.Vector3.Dot(angularVelocity, av_rotate_right) > min_thrust_effect) {
                RCSyawNegParticleSystem1.start();
                RCSyawNegParticleSystem2.start();
            } else {
                RCSyawNegParticleSystem1.stop();
                RCSyawNegParticleSystem2.stop();
            }
        }
        if (engine_firing) {
                if(!spaceCraft)
                    return;
                if(!spaceCraft.physicsImpostor)
                    return;  
                forceDirection = spaceCraft.absolutePosition.subtract(spaceCraftThrusterOffset.absolutePosition).normalize();
                const forceMagnitude = 40;
                var contactLocalRefPoint = BABYLON.Vector3.Zero();
                spaceCraft.physicsImpostor.applyForce(forceDirection.scale(forceMagnitude), spaceCraft.getAbsolutePosition().add(contactLocalRefPoint));
        }
    }, 33);
}
