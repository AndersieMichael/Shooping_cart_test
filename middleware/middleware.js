//IMPORT
const moment = require("moment")

//FUNCTION
const verify = require('../utilities/token').verifyAccessToken

//logging
const logApiBasic = require('../utilities/slack').logApiBasic;

//connection

const pool = require('../utilities/connection').pool

let head_route_name = "/middleware"

/**
 * mengambil token dari header
 * 
 * @param {*} req req dari middleware
 * @returns 
 */

function getTokenFromHeader(req){
    let header_target = "authorization";
    header_target = header_target.toLowerCase();
    if(req.headers[header_target]){
        return req.headers[header_target].toString().split("Bearer ")[1];
    }
    return null;
}

/**
 * get customer data from middleware
 * 
 * @param {*} pg_client pool connection
 * @param {number} id  customer id
 * @returns 
 */

async function getCustomerData(pg_client,id){
    let query
    let value
    let success
    let result

    try {
        query= `select * from customer
                where customer_id=$1`
        value=[
            id
        ]
        const temp = await pg_client.query(query,value)
        if(temp==null || temp==undefined){
            throw new Error(`query Resulted on: ${temp}`)
        }else{
            result= temp.rows
            success = true
        }
    } catch (error) {
        console.error(error.message);
        success=false;
        result=err.message;
    }
    return[success,result]
}

//
/**
 * middleware for customer
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */

async function customerMiddleware(req,res,next){
    
    //Basic Info
    
    let request_namepath = req.path
    let time_requested = moment(Date.now())

    let data_toview_on_error = {
        "Header" : req.headers
    }

    //get token from header
    
    const token = getTokenFromHeader(req)

    //checking token

    if(token==null || token==undefined){
        const message = {
            "message": "Failed",
            "error_key": "error_no_auth_token",
            "error_message": `Token doesnt exists`,
            "error_data": {
                "Request_Headers": req.headers
            }
        };
         //LOGGING
         logApiBasic( 
            `Request ${head_route_name}${request_namepath} Failed`,
            `REQUEST GOT AT : ${time_requested} \n` +
            "REQUEST BODY/PARAM : \n" +
            JSON.stringify('', null, 2),
            JSON.stringify(message, null, 2)
        );
        res.status(401).json(message);
        return; //END 
    }

    //verify acses token

    let [verify_success,verify_result] = verify(token)

    console.log(JSON.stringify(verify_result, null, 2));
    
    //verify fail
    
    if(!verify_success){
        console.error(verify_result);
        const message = {
            "message": "Failed",
            "error_key": "error_invalid_token",
            "error_message": "Invalid token",
            "error_data": {
                "Request_Headers": req.headers
            }   
        };
        //LOGGING
        logApiBasic( 
            `Request ${head_route_name}${request_namepath} Failed`,
            `REQUEST GOT AT : ${time_requested} \n` +
            "REQUEST BODY/PARAM : \n" +
            JSON.stringify('', null, 2),
            JSON.stringify(message, null, 2)
        );
      res.status(401).json(message);
      return; //END
    }

    //token verify found expired

    if(verify_result == "TokenExpiredError"){
        console.error(verify_result);
        const message = {
            "message": "Failed",
            "error_key": "error_expired_token",
            "error_message": "Token Expired",
            "error_data": {
              "Request_Headers": req.headers
          }
        };
        //LOGGING
        logApiBasic( 
            `Request ${head_route_name}${request_namepath} Failed`,
            `REQUEST GOT AT : ${time_requested} \n` +
            "REQUEST BODY/PARAM : \n" +
            JSON.stringify('', null, 2),
            JSON.stringify(message, null, 2)
        );
        res.status(401).json(message);
        return; //END
    }   

    //get cust id from verify data

    let customer_id = verify_result["customer_id"];

    const pg_client = await pool.connect()

    //get customer data from customer id that get it from token
    
    let [customer_success, customer_result] = await getCustomerData(pg_client,customer_id);

    // fail get customer

    if (!customer_success){
        console.error(customer_result);
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": customer_result,
            "error_data": "ON getCustomerData"
        };
        //LOGGING
        logApiBasic( 
            `Request ${head_route_name}${request_namepath} Failed`,
            `REQUEST GOT AT : ${time_requested} \n` +
            "REQUEST BODY/PARAM : \n" +
            JSON.stringify('', null, 2),
            JSON.stringify(message, null, 2)
        );
        res.status(200).json(message);
        pg_client.release();
        return; //END
    }
    
    // ID NOT FOUND

    if (customer_result.length === 0){
        console.error(customer_result);
        const message = {
            "message": "Failed",
            "error_key": "error_invalid_token",
            "error_message": "Cant found data with id on token :: " + customer_id.toString(),
            "error_data": {
                "ON": "getCustomerData",
                "ID": customer_id
            }
        };
        //LOGGING
        logApiBasic( 
            `Request ${head_route_name}${request_namepath} Failed`,
            `REQUEST GOT AT : ${time_requested} \n` +
            "REQUEST BODY/PARAM : \n" +
            JSON.stringify('', null, 2),
            JSON.stringify(message, null, 2)
        );
        res.status(401).json(message);
        pg_client.release();
        return; //END
    }        

    pg_client.release();

    //adding the data to local

    res.locals.curr_customer_id = customer_id;
    res.locals.curr_customer_data = customer_result;
    next();
}

exports.customerMiddlware = customerMiddleware