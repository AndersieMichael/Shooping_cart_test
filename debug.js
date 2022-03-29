//CONST
var debugMode = true

// This function logs console messages when debugMode is true .
function debugLog(logMessage){
    if(debugMode){
        console.log(logMessage);
    }
}


module.exports = debugLog