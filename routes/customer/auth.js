
//IMPORT

const bcrypt = require('bcrypt')

//FUNCTION

const generateRefreshToken = require('../../utilities/token').generateRefreshToken;
const generateActiveToken = require('../../utilities/token').generateActiveToken;
const verifyRefreshToken = require('../../utilities/token').verifyRefreshToken;

/**
 * login Customer
 * 
 * @param {*} pg_client pool connection 
 * @param {string} password customer password not encrypt
 * @param {string} username customer username
 * @returns 
 */

 async function loginCustomer(pg_client,password,username){
    let query
    let value
    let success
    let result

    //get customer

    try {
        query= `select * from customer
                where username=$1`
        value=[
            username
        ]
        const temp = await pg_client.query(query,value)
        if(temp==null || temp==undefined){
            throw new Error(`query Resulted on: ${temp}`)
        }else{
            result= temp.rows
            success = true
        }
    } 
    //ERROR
    catch (error) {
        console.error(error.message);
        success=false;
        result=err.message;
    }
    
    //id not found

    if(result.length === 0){ 
        result="INVALID_USERNAME"
        return[success,result]; //END
    }
    
    //checking password with encrpyt
    
    let cpass =await bcrypt.compare(password,result[0]["password"]) 
    if(!cpass){
        success = true;
        result="INVALID_PASSWORD"
        return[success,result]; //END
    }

    //remove data from array

    data = result[0]

    //remove token key from data that want convert to token

    delete data["token_key"]
    delete data["password"]

    //generate active token 

    let[Active_token_success,Active_token_result] = generateActiveToken(data)
    if(!Active_token_success){
       console.error(Active_token_success);
    }

    //generate Refresh token
    
    let[refresh_token_success,refresh_token_result] = generateRefreshToken(data)

    if(!refresh_token_success){
        console.error(refresh_token_result);
    }


    //update and insert token key in database 

    try {
        query= `update customer 
                set "token_key" =$2
                where username =$1`
        value=[
            username,
            refresh_token_result
        ]
        const temp = await pg_client.query(query,value)
        if(temp==null || temp==undefined){
            throw new Error(`query Resulted on: ${temp}`)
        }else{
            success = true
        }
    } 
    //ERROR
    catch (error) {
        console.error(error.message);
        success=false;
        result=err.message;
    }

    result = {
        "Refresh_Token": refresh_token_result,
        "Access_Token" : Active_token_result
    }

    return[success,result]
}

/**
 * logoutCustomer
 * 
 * @param {*} pg_client pool connection 
 * @param {number} id customer id 
 * @returns 
 */

 async function logoutCustomer(pg_client,id){
    let query
    let value
    let success
    let result

    //update the token in database into null

    try {
        query= `update customer 
                set "token_key" =null
                where customer_id =$1`
        value=[
            id
        ]
        const temp = await pg_client.query(query,value)
        if(temp==null || temp==undefined){
            throw new Error(`query Resulted on: ${temp}`)
        }else{
            success = true
        }
    } catch (error) {
        console.error(error.message);
        success=false;
        result=err.message;
    }

    result = null;

    return[success,result]
}

/**
 * checking refresh token
 * 
 * @param {*} pg_client pool connection 
 * @param {string} refresh_token refresh token
 * @returns 
 */

 async function validateRefreshToken(pg_client,refresh_token){
    let query
    let value
    let success
    let result

    //verify for refresh token 

    let[refresh_token_success,refresh_token_result] = verifyRefreshToken(refresh_token)

    if(!refresh_token_success){
        console.error(refresh_token_result);
        success = false;
        result = refresh_token_result;
        return [
            success,
            result
        ]; 
    }

    //if refresh token expired

    if(refresh_token_result == "TokenExpiredError"){
       success=true;
       result = "TOKEN_EXPIRED";
       return[success,result];
    }   
   
    //get customer id from token

    let customer_id = refresh_token_result["customer_id"];
    
    //get token key from database

    try {
        query= `select token_key from customer 
                where customer_id =$1`
        value=[
            customer_id
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
        return[success,result];
    }

    //compare insert refresh token with refresh token in database
    
    let tokenInDatabase = result[0]["token_key"];
    if(refresh_token != tokenInDatabase){
        success = true;
        result = "INVALID_TOKEN";
        return [
            success,
            result
        ]; 
    }
    
    let data = refresh_token_result
    
    //delete exp from data 

    delete data["exp"]
  
    //generate new active token

    let[Active_token_success,Active_token_result] = generateActiveToken(refresh_token_result)
    if(!Active_token_success){
        console.error(Active_token_result);
        success = false;
        result = Active_token_result;
        return [
            success,
            result
        ]; 
    }

    //generate Refresh token
    
    let[new_refresh_token_success,new_refresh_token_result] = generateRefreshToken(data)

    if(!new_refresh_token_success){
        console.error(new_refresh_token_result);
    }

   

    //update and insert token key in database 

    try {
        query= `update customer 
                set "token_key" =$2
                where customer_id =$1`
        value=[
            customer_id,
            new_refresh_token_result
        ]
        const temp = await pg_client.query(query,value)
        if(temp==null || temp==undefined){
            throw new Error(`query Resulted on: ${temp}`)
        }else{
            success = true
        }
    } catch (error) {
        console.error(error.message);
        success=false;
        result=err.message;
    }

    result = {
        "Refresh_Token": new_refresh_token_result,
        "Access_Token" : Active_token_result
    }

    return[success,result]
}


//EXPORTS

exports.loginCustomer = loginCustomer
exports.logoutCustomer = logoutCustomer
exports.validateRefreshToken = validateRefreshToken