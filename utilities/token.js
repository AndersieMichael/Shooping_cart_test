//IMPORT
const jwt = require('jsonwebtoken');
const fs = require('fs');

//read key
let key_private = fs.readFileSync('./required/tokenFile/private.key','utf8');
let key_public = fs.readFileSync('./required/tokenFile/public.key','utf8');
let refresh_key ="test";

/**
 * create refresh token
 * 
 * @param {object} Customer_data customer data 
 * @returns 
 */

function generateRefreshToken(Customer_data){
    let success;
    let refresh_token;
    try {
        refresh_token = jwt.sign(Customer_data,refresh_key,{
            expiresIn:'1d',
            algorithm: "HS256"
        })

        success=true;

    } catch (err) {
        console.error(err.message);
        refresh_token = err.message;
        success = false;
    }
    return[success,refresh_token]

}

/**
 * create active token
 * 
 * @param {object} Customer_data customer data 
 * @returns 
 */

function generateActiveToken(Customer_data){
    let success;
    let access_token;
    
    try {
        access_token = jwt.sign(Customer_data,key_private,{
            expiresIn:'30m',
            algorithm : "RS256"
        })
        success = true;
        
    } catch (err) {
        console.error(err.message);
        access_token=err.message;
        success = false;
    }

    //change refresh key with access token

    refresh_key = access_token;

    return [success,access_token]
}


/**
 * checking active token still active or not
 * 
 * @param {string} token active token
 * @returns 
 */

function verifyAccessToken(token){
    let success
    let valid_data;

    try {
        valid_data = jwt.verify(token,key_public,{
            algorithms:"RS256"
        })
        success = true

    } catch (err) {
        console.error(err.message);
        valid_data = err.message;
        success = false;

        // EXPIRED
        if(err.name == "TokenExpiredError"){
            success = true;
            valid_data = "TokenExpiredError";
        }
    }

    return [success,valid_data];
}

/**
 * checking refresh token still active or not
 * 
 * @param {string} token refresh token
 * @returns 
 */

function verifyRefreshToken(token){
    let success;
    let refresh_token;

    try {
        refresh_token = jwt.verify(token,refresh_key,{
            algorithms:"HS256"
        })
        success = true

        success=true;

    } catch (err) {
        console.error(err.message);
        refresh_token = err.message;
        success = false;
    }
    return[success,refresh_token]

}


exports.generateRefreshToken = generateRefreshToken
exports.generateActiveToken = generateActiveToken
exports.verifyAccessToken = verifyAccessToken
exports.verifyRefreshToken = verifyRefreshToken