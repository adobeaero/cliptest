//@version 1
/*

Extension for recording of Aero experience sessions

*/

if(typeof __filename === "undefined") {
    //If we are in babylon, track down the RTM object
    //We can use the first anchor in the first scene because RTM is static
    babylonScene = engine.scenes[0];
    anchor = babylonScene.getNodeByName("Ag_Anchor");
    RTM = anchor.aeroScene.GetRTM();
}

var sessionRecordingAction = new RTM.Action();
sessionRecordingAction.setName('SessionRecording');
sessionRecordingAction.property('RecordingEvent').setString("Optional");
sessionRecordingAction.insideAero = true;
if(typeof __filename === "undefined") {
    var result = new Object();
    sessionRecordingAction.insideAero = false;
};

sessionRecordingAction.setOnStart(function(action){
    var result = new Object();
    if(action.RecordingEvent == "Optional" || action.RecordingEvent == undefined) {
        
    } else if(action.RecordingEvent == "Initialize Recording") {
        var textInput = gUIElements["Recording File Name Text Input"];
        if(textInput) {
            var fileName = GetTimeStampedName();
            textInput.text = fileName;
        }
    } else if(action.RecordingEvent == "Begin Recording") {
        if(typeof webkit !== 'undefined') {
            var textInput = gUIElements["Recording File Name Text Input"];
            if(webkit.messageHandlers.aero != undefined && textInput != undefined) {
                webkit.messageHandlers.aero.postMessage("startRecording:" + textInput.text);
            }
        }
        //logger.info("Recording Begin");
    } else if(action.RecordingEvent == "End Recording") {
        if(typeof webkit !== 'undefined') {
            if(webkit.messageHandlers.aero) {
                webkit.messageHandlers.aero.postMessage("stopAR");
            }
        }
        var textInput = gUIElements["Recording File Name Text Input"];
        if(textInput) {
            var fileName = GetTimeStampedName();
            textInput.text = fileName;
        }
        //logger.info("Recording End");
    }
    
    result.status = "done";
    return result;
});
sessionRecordingAction.setOnUpdate(function(action){
    var result = new Object();
    result.status = "done";
    return result;
});

RTM.scene.addActionPrototype(sessionRecordingAction);

if(sessionRecordingAction.insideAero) {
    RTM.application.watchFileForReload(__filename);
    RTM.application.registerScriptAction('SessionRecording', __filename);
    logger.info("SessionRecording Extension Loaded");
} else {
    console.log("SessionRecording Behavior Loaded")
}

function GetTimeStampedName() {
    var date = new Date();

    var day = date.getDate();
    var dayString = "";
    if(day<10)
        dayString += "0";
    dayString += day;

    var month = date.getMonth()+1;
    var monthString = "";
    if(month<10)
        monthString += "0";
    monthString += month;

    var yearString = date.getFullYear();

    var hour = date.getHours();
    var hourString = "";
    if(hour<10)
        hourString += "0";
    hourString += hour;

    var minute = date.getMinutes();
    var minuteString = "";
    if(minute<10)
        minuteString += "0";
    minuteString += minute;

    var seconds = date.getSeconds();
    var secondsString = "";
    if(seconds<10)
        secondsString += "0";
    secondsString += seconds;

    var fileName = "Session_" + 
        yearString + "_" +
        monthString + "_" +
        dayString + "_" +
        hourString + "_" +
        minuteString + "_" +
        secondsString + ".json";

        return fileName;
}