//IMPORT
const axios = require('axios').default;

function logApiBasic(error_text,error_trace, extra_data = "-"){
    let url_hook = "https://hooks.slack.com/services/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"

    const header={
        'content-type':'application/json'
    }

    const body={
        "text":error_text.toString() + "! \n```" + error_trace.toString() +"``` \n ```" + extra_data.toString() + "``` "
    }

    //SEND TO HOOK
    axios.post(url_hook,body,{headers : header }).then(()=>{
        console.log("Parshing slack-logging Done");
    }).catch(()=>{
        console.log("Parshing slack-logging FAIL");
    })
}

exports.logApiBasic = logApiBasic;