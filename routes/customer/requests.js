//IMPORT
const express = require('express')
const router = express.Router()
const joi = require('joi')
const bcrypt = require('bcrypt')
const moment = require("moment")

//FUNCTION

const getAllCustomer = require('./functions').getAllCustomer
const getCustomerByID = require('./functions').customerById
const checkingUsername = require('./functions').checkingUsername
const addCustomer = require('./functions').addCustomer
const updateCustomer = require('./functions').updateCustomer
const deleteCustomer = require('./functions').deleteCustomer
const CountAllCustomer = require('./functions').CountAllCustomer

//PAGINATION
const PaginatePagesSimple = require('../../paginate').PaginatePagesSimple;

//AUTH FUNCTION
const login = require('./auth').loginCustomer
const logout = require('./auth').logoutCustomer
const verifyRefreshToken = require('./auth').validateRefreshToken

//logging
// const logApiBasic = require('../../utilities/slack').logApiBasic;

//middleware

const middleware = require('../../middleware/middleware').customerMiddlware

//conection to database

const pool = require('../../utilities/connection').pool

let head_route_name = "/customer"


//VIEW ALL CUSTOMER USING PAGINATE
//===============================================================================================
router.get('/view' , async(req , res)=>{
       
    //Basic Info
    
    let request_namepath = req.path
    let time_requested = moment(Date.now())

    //JOI QUERY VALIDATION

    let joi_template_query = joi.object({
        "Page": joi.number().min(1).required(),
        "Limit": joi.number().required(),
    }).required();

    const url_query = req.query;

    let joi_validation_query = joi_template_query.validate(url_query);

    //ERROR VALIDATION QUERY

    if(joi_validation_query.error){
        const message = {
            "message": "Failed",
            "error_key": "error_query",
            "error_message": joi_validation_query.error.stack,
            "error_data": joi_validation_query.error.details
        };
        //LOGGING
        // logApiBasic( 
        //     `Request ${head_route_name}${request_namepath} Failed`,
        //     `REQUEST GOT AT : ${time_requested} \n` +
        //     "REQUEST BODY/PARAM : \n" +
        //     JSON.stringify('', null, 2),
        //     JSON.stringify(message, null, 2)
        // );
        res.status(200).json(message);
        return; //END

    }

    //PARAM
    let current_page = joi_validation_query.value["Page"];
    let limit = joi_validation_query.value["Limit"];



    const pg_client = await pool.connect()

    //GET ALL CUSTOMER

    let[success,result] = await getAllCustomer(pg_client,current_page,limit)
    
    //ERROR GET ALL CUSTOMER
    
    if(!success){

        console.error(result);
        pg_client.release();
        
        //Error Message
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": result,
            "error_data": "ON viewAllCustomer"
        };
        
        //LOGGING
        // logApiBasic( 
        //     `Request ${head_route_name}${request_namepath} Failed`,
        //     `REQUEST GOT AT : ${time_requested} \n` +
        //     "REQUEST BODY/PARAM : \n" +
        //     JSON.stringify('', null, 2),
        //     JSON.stringify(message, null, 2)
        // );

        //SUCCESS

        res.status(200).json(message)
        return;
    }

    //COUNT ALL TOTAL CUSTOMER

    let[tsuccess,tresult] = await CountAllCustomer(pg_client)
    
    //ERROR COUNT ALL TOTAL CUSTOMER
    
    if(!tsuccess){

        console.error(tresult);
        pg_client.release();
        
        //Error Message
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": tresult,
            "error_data": "ON calculate Total CUstomer"
        };
        
        //LOGGING
        // logApiBasic( 
        //     `Request ${head_route_name}${request_namepath} Failed`,
        //     `REQUEST GOT AT : ${time_requested} \n` +
        //     "REQUEST BODY/PARAM : \n" +
        //     JSON.stringify('', null, 2),
        //     JSON.stringify(message, null, 2)
        // );

        //SUCCESS

        res.status(200).json(message)
        return;
    }

    let total = tresult[0]["count"]

    //change to paginate template

    let final = PaginatePagesSimple(result,current_page,limit,total)

    //success

    pg_client.release();
    res.status(200).json({"message":"Success","data":final})
    return;

})


//VIEW ALL CUSTOMER BY CUSTOMER ID IN PARAMETER
//===============================================================================================
router.get('/view/:id' , async(req , res)=>{

    //Basic Info
    
    let request_namepath = req.path
    let time_requested = moment(Date.now())
    
    //joi validation param

    let joi_template_param = joi.number().required();

    let joi_validate_param = joi_template_param.validate(req.params.id);
    
    //Error validation
    
    if(joi_validate_param.error){
        const message = {
            "message": "Failed",
            "error_key": "error_param",
            "error_message": joi_validate_param.error.stack,
            "error_data": joi_validate_param.error.details
        };
        //LOGGING
        // logApiBasic( 
        //     `Request ${head_route_name}${request_namepath} Failed`,
        //     `REQUEST GOT AT : ${time_requested} \n` +
        //     "REQUEST BODY/PARAM : \n" +
        //     JSON.stringify('', null, 2),
        //     JSON.stringify(message, null, 2)
        // );
        res.status(200).json(message);
        return; //END
    }

    //PARAM
    const customer_id = req.params.id
    
    const pg_client = await pool.connect()

    //GET CUSTOMER BY CUSTOMER ID

    let[success,result] = await getCustomerByID(pg_client,customer_id)
     
    //FAIL GET CUSTOMER BY CUSTOMER ID

    if(!success){

        console.error(result);
        pg_client.release();
        
        //Error Message
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": result,
            "error_data": "ON viewCustomerByID"
        };
        
        //LOGGING
        // logApiBasic( 
        //     `Request ${head_route_name}${request_namepath} Failed`,
        //     `REQUEST GOT AT : ${time_requested} \n` +
        //     "REQUEST BODY/PARAM : \n" +
        //     JSON.stringify('', null, 2),
        //     JSON.stringify(message, null, 2)
        // );

        res.status(200).json(message)
        return;
    }

    ////Error (data not found / kosong)

    if(result.length === 0){ 

        console.error(result);
        const message = {
            "message": "Failed",
            "error_key": "error_id_not_found",
            "error_message": "Cant found Customer with id :: " + customer_id.toString(),
            "error_data": {
                "ON": "Customer_ID_Exist",
                "ID": customer_id
            }
        };
        //LOGGING
        // logApiBasic( 
        //     `Request ${head_route_name}${request_namepath} Failed`,
        //     `REQUEST GOT AT : ${time_requested} \n` +
        //     "REQUEST BODY/PARAM : \n" +
        //     JSON.stringify('', null, 2),
        //     JSON.stringify(message, null, 2)
        // );
        pg_client.release();
        res.status(200).json(message);
        return; //END
    }

    //success

    pg_client.release();
    res.status(200).json({"message":"Success","data":result})
    return;

})


//ADD CUSTOMER
//===============================================================================================
router.post('/register',async(req,res)=>{

    //Basic Info
    
    let request_namepath = req.path
    let time_requested = moment(Date.now())
    
    //validation the body
    
    let joi_template_body = joi.object({
        "name": joi.string().required(),
        "phone": joi.string().required(),
        "username": joi.string().required(),
        "password":joi.string().required(),
    }).required();

    const req_body = req.body
    
    let joi_body_validation = joi_template_body.validate(req_body);

    //ERROR VALIDATION BODY

    if(joi_body_validation.error){
        const message = {
            "message": "Failed",
            "error_key": "error_body",
            "error_message": joi_body_validation.error.stack,
            "error_data": joi_body_validation.error.details
        };
        //LOGGING
        // logApiBasic( 
        //     `Request ${head_route_name}${request_namepath} Failed`,
        //     `REQUEST GOT AT : ${time_requested} \n` +
        //     "REQUEST BODY/PARAM : \n" +
        //     JSON.stringify('', null, 2),
        //     JSON.stringify(message, null, 2)
        // );
        res.status(200).json(message);
        return; //END

    }

    //PARAM

    let name = joi_body_validation.value["name"];
    let phone = joi_body_validation.value["phone"];
    let username = joi_body_validation.value["username"];
    let password = joi_body_validation.value["password"];

    const pg_client = await pool.connect()

    //checking username jika username ditemukan maka akan ditolak.

    let[nsuccess,nresult] = await checkingUsername(pg_client,username)
        
    //checking username fail

        if(!nsuccess){
            
            //Error
            
            console.error(nresult);
            pg_client.release();
            
            const message = {
                "message": "Failed",
                "error_key": "error_internal_server",
                "error_message": nresult,
                "error_data": "ON checkingNameExist"
            };
            // //LOGGING
            // logApiBasic( 
            //     `Request ${head_route_name}${request_namepath} Failed`,
            //     `REQUEST GOT AT : ${time_requested} \n` +
            //     "REQUEST BODY/PARAM : \n" +
            //     JSON.stringify('', null, 2),
            //     JSON.stringify(message, null, 2)
            // );

            res.status(200).json(message)
            return;
        }

        //jika data ditemukan

        if(nresult.length != 0){
            const message = {
                "message": "Failed",
                "error_key": "error_name_duplicate",
                "error_message": "Username already registered :: " + username.toString(),
                "error_data": {
                    "ON": "checkingUsernameExist",
                    "Name": username
                }
            };
            // //LOGGING
            // logApiBasic( 
            //     `Request ${head_route_name}${request_namepath} Failed`,
            //     `REQUEST GOT AT : ${time_requested} \n` +
            //     "REQUEST BODY/PARAM : \n" +
            //     JSON.stringify('', null, 2),
            //     JSON.stringify(message, null, 2)
            // );
            pg_client.release();
            res.status(200).json(message);
            return; //END
        }

    let newPass = await bcrypt.hash(password,10)

    //insert to database

    let[success,result] = await addCustomer(pg_client,name,phone,username,newPass)
    
    //addCustomer fail

    if(!success){
        
        
        console.error(result);
        pg_client.release();
        
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": result,
            "error_data": "ON addCustomer"
        };
        //LOGGING
        // logApiBasic( 
        //     `Request ${head_route_name}${request_namepath} Failed`,
        //     `REQUEST GOT AT : ${time_requested} \n` +
        //     "REQUEST BODY/PARAM : \n" +
        //     JSON.stringify('', null, 2),
        //     JSON.stringify(message, null, 2)
        // );

        res.status(200).json(message)
        return;
    }
    
    //success

    pg_client.release();
    res.status(200).json({"message":"Success","data":result})
    return;
})


//UPDATE CUSTOMER BY CUSTOMER ID
//===============================================================================================
router.put('/update/:id',async(req,res)=>{
    
    //Basic Info
    
    let request_namepath = req.path
    let time_requested = moment(Date.now())

    //joi validation param

    let joi_template_param = joi.number().required();

    let joi_validate_param = joi_template_param.validate(req.params.id);

    //ERROR VALIDATE PARAM

    if(joi_validate_param.error){
        const message = {
            "message": "Failed",
            "error_key": "error_param",
            "error_message": joi_validate_param.error.stack,
            "error_data": joi_validate_param.error.details
        };
        //LOGGING
        // logApiBasic( 
        //     `Request ${head_route_name}${request_namepath} Failed`,
        //     `REQUEST GOT AT : ${time_requested} \n` +
        //     "REQUEST BODY/PARAM : \n" +
        //     JSON.stringify('', null, 2),
        //     JSON.stringify(message, null, 2)
        // );
        res.status(200).json(message);
        return; //END
    }

        
    //validation the body
    
    let joi_template_body = joi.object({
        "name": joi.string().required(),
        "phone": joi.string().required(),
        "username": joi.string().required(),
        "password":joi.string().required(),
    }).required();

    const req_body = req.body
    
    let joi_body_validation = joi_template_body.validate(req_body);

    //ERROR VALIDATION BODY

    if(joi_body_validation.error){
        const message = {
            "message": "Failed",
            "error_key": "error_body",
            "error_message": joi_body_validation.error.stack,
            "error_data": joi_body_validation.error.details
        };
        //LOGGING
        // logApiBasic( 
        //     `Request ${head_route_name}${request_namepath} Failed`,
        //     `REQUEST GOT AT : ${time_requested} \n` +
        //     "REQUEST BODY/PARAM : \n" +
        //     JSON.stringify('', null, 2),
        //     JSON.stringify(message, null, 2)
        // );
        res.status(200).json(message);
        return; //END

    }

    //PARAM

    let name = joi_body_validation.value["name"];
    let phone = joi_body_validation.value["phone"];
    let username = joi_body_validation.value["username"];
    let password = joi_body_validation.value["password"];

    const customer_id = req.params.id

    const pg_client = await pool.connect()

    //CHECKING CUSTOMER EXIST

    let[csuccess,cresult] = await getCustomerByID(pg_client,customer_id)

    //CHECKING FAIL

    if(!csuccess){

        console.error(cresult);
        pg_client.release();
        
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": cresult,
            "error_data": "ON checkingcustomerByID"
        };
        //LOGGING
        // logApiBasic( 
        //     `Request ${head_route_name}${request_namepath} Failed`,
        //     `REQUEST GOT AT : ${time_requested} \n` +
        //     "REQUEST BODY/PARAM : \n" +
        //     JSON.stringify('', null, 2),
        //     JSON.stringify(message, null, 2)
        // );

        res.status(200).json(message)
        return;
    }

    //ERROR (ID tidak ditemukan)

    if(cresult.length === 0){ 
        
        console.error(cresult);
        const message = {
            "message": "Failed",
            "error_key": "error_id_not_found",
            "error_message": "Cant found data with id :: " + customer_id.toString(),
            "error_data": {
                "ON": "Customer_ID_Exist",
                "ID": customer_id
            }
        };
        //LOGGING
        // logApiBasic( 
        //     `Request ${head_route_name}${request_namepath} Failed`,
        //     `REQUEST GOT AT : ${time_requested} \n` +
        //     "REQUEST BODY/PARAM : \n" +
        //     JSON.stringify('', null, 2),
        //     JSON.stringify(message, null, 2)
        // );
        pg_client.release();
        res.status(200).json(message);
        return; //END
    }

    //checking username jika username ditemukan maka akan ditolak.

    let[nsuccess,nresult] = await checkingUsername(pg_client,username)
        
    //checking username fail
 
    if(!nsuccess){
             
             //Error
             
             console.error(nresult);
             pg_client.release();
             
             const message = {
                 "message": "Failed",
                 "error_key": "error_internal_server",
                 "error_message": nresult,
                 "error_data": "ON checkingNameExist"
             };
             //LOGGING
            //  logApiBasic( 
            //      `Request ${head_route_name}${request_namepath} Failed`,
            //      `REQUEST GOT AT : ${time_requested} \n` +
            //      "REQUEST BODY/PARAM : \n" +
            //      JSON.stringify('', null, 2),
            //      JSON.stringify(message, null, 2)
            //  );
 
             res.status(200).json(message)
             return;
    }
 
    //jika data ditemukan maka akan fail, karena must be unique
 
    if(nresult.length != 0){
             const message = {
                 "message": "Failed",
                 "error_key": "error_name_duplicate",
                 "error_message": "Username already registered :: " + username.toString(),
                 "error_data": {
                     "ON": "checkingUsernameExist",
                     "Name": username
                 }
             };
             //LOGGING
            //  logApiBasic( 
            //      `Request ${head_route_name}${request_namepath} Failed`,
            //      `REQUEST GOT AT : ${time_requested} \n` +
            //      "REQUEST BODY/PARAM : \n" +
            //      JSON.stringify('', null, 2),
            //      JSON.stringify(message, null, 2)
            //  );
             pg_client.release();
             res.status(200).json(message);
             return; //END
    }
    
    //change password to bcrypt

    let newPass = await bcrypt.hash(password,10)

    //send to update data

    let[success,result] = await updateCustomer(pg_client,customer_id,name,phone,username,newPass)

    //ERROR UPDATE CUSTOMER

    if(!success){
        
        console.error(result);
        pg_client.release();
        
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": result,
            "error_data": "ON UpdateCustomer"
        };
        //LOGGING
        // logApiBasic( 
        //     `Request ${head_route_name}${request_namepath} Failed`,
        //     `REQUEST GOT AT : ${time_requested} \n` +
        //     "REQUEST BODY/PARAM : \n" +
        //     JSON.stringify('', null, 2),
        //     JSON.stringify(message, null, 2)
        // );

        res.status(200).json(message)
        return;
    }

    //success

    pg_client.release();
    res.status(200).json({"message":"Success","data":result})
    return;

})


//DELETE CUSTOMER BY CUSTOMER ID
//===============================================================================================
router.delete('/delete/:id',async(req,res)=>{

    //Basic Info
    
    let request_namepath = req.path
    let time_requested = moment(Date.now())

    //joi validation param

    let joi_template_param = joi.number().required();

    //ERROR VALIDATE PARAM

    let joi_validate_param = joi_template_param.validate(req.params.id);

    //ERROR VALIDATION PARAM
    
    if(joi_validate_param.error){
        const message = {
            "message": "Failed",
            "error_key": "error_param",
            "error_message": joi_validate_param.error.stack,
            "error_data": joi_validate_param.error.details
        };
        //LOGGING
        // logApiBasic( 
        //     `Request ${head_route_name}${request_namepath} Failed`,
        //     `REQUEST GOT AT : ${time_requested} \n` +
        //     "REQUEST BODY/PARAM : \n" +
        //     JSON.stringify('', null, 2),
        //     JSON.stringify(message, null, 2)
        // );
        res.status(200).json(message);
        return; //END
    }

    //PARAM
    const customer_id = req.params.id
    
    const pg_client = await pool.connect()
    
    //GET CUSTOMER BY ID
    
    let[csuccess,cresult] = await getCustomerByID(pg_client,customer_id)

    //ERROR TO GET CUSTOMER ID
    
    if(!csuccess){
        
        console.error(cresult);
        pg_client.release();
        
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": cresult,
            "error_data": "ON checkingCustomerByID"
        };
        //LOGGING
        // logApiBasic( 
        //     `Request ${head_route_name}${request_namepath} Failed`,
        //     `REQUEST GOT AT : ${time_requested} \n` +
        //     "REQUEST BODY/PARAM : \n" +
        //     JSON.stringify('', null, 2),
        //     JSON.stringify(message, null, 2)
        // );

        res.status(200).json(message)
        return;
    }

    //ERROR (ID tidak ditemukan)

    if(cresult.length === 0){ 
        
        console.error(cresult);
        const message = {
            "message": "Failed",
            "error_key": "error_id_not_found",
            "error_message": "Cant found data with id :: " + customer_id.toString(),
            "error_data": {
                "ON": "Customer_ID_EXIST",
                "ID": customer_id
            }
        };
        //LOGGING
        // logApiBasic( 
        //     `Request ${head_route_name}${request_namepath} Failed`,
        //     `REQUEST GOT AT : ${time_requested} \n` +
        //     "REQUEST BODY/PARAM : \n" +
        //     JSON.stringify('', null, 2),
        //     JSON.stringify(message, null, 2)
        // );
        pg_client.release();
        res.status(200).json(message);
        return; //END
    }

    // delete customer

    let[success,result] = await deleteCustomer(pg_client,customer_id)

    //FAIL DELETE CUSTOMER

    if(!success){
        
        console.error(result);
        pg_client.release();
        
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": result,
            "error_data": "ON deleteCustomer"
        };
        //LOGGING
        // logApiBasic( 
        //     `Request ${head_route_name}${request_namepath} Failed`,
        //     `REQUEST GOT AT : ${time_requested} \n` +
        //     "REQUEST BODY/PARAM : \n" +
        //     JSON.stringify('', null, 2),
        //     JSON.stringify(message, null, 2)
        // );

        res.status(200).json(message)
        return;
    }
    
    //success

    pg_client.release();
    res.status(200).json({"message":"Success","data":result})
    return;
})


//customer login
//===============================================================================================
router.post('/login',async(req,res)=>{
    
    //Basic Info
    
    let request_namepath = req.path
    let time_requested = moment(Date.now())

    //validation the body
    
    let joi_template_body = joi.object({
        "username": joi.string().required(),
        "password": joi.string().required(),
    }).required();

    const req_body = req.body
    
    let joi_body_validation = joi_template_body.validate(req_body);

    //ERROR VALIDATION

    if(joi_body_validation.error){
        const message = {
            "message": "Failed",
            "error_key": "error_body",
            "error_message": joi_body_validation.error.stack,
            "error_data": joi_body_validation.error.details
        };
        //LOGGING
        // logApiBasic( 
        //     `Request ${head_route_name}${request_namepath} Failed`,
        //     `REQUEST GOT AT : ${time_requested} \n` +
        //     "REQUEST BODY/PARAM : \n" +
        //     JSON.stringify('', null, 2),
        //     JSON.stringify(message, null, 2)
        // );
        res.status(200).json(message);
        return; //END

    }

    //parameter

    let username = joi_body_validation.value["username"];
    let password = joi_body_validation.value["password"];

    const pg_client = await pool.connect()

    //insert to database

    let[success,result] = await login(pg_client,password,username)

    //ERROR INSERT 

    if(!success){
        
        console.error(result);
        pg_client.release();
        
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": result,
            "error_data": "ON tryToLogin"
        };
        //LOGGING
        // logApiBasic( 
        //     `Request ${head_route_name}${request_namepath} Failed`,
        //     `REQUEST GOT AT : ${time_requested} \n` +
        //     "REQUEST BODY/PARAM : \n" +
        //     JSON.stringify('', null, 2),
        //     JSON.stringify(message, null, 2)
        // );

        res.status(200).json(message)
        return;
    }

     //ERROR INVALID PASSWORD

    if(result =="INVALID_PASSWORD"){ 
        
        console.error(result);
        const message = {
            "message": "Failed",
            "error_key": "error_invalid_password",
            "error_message": "password is wrong for username :: " + username.toString(),
            "error_data": {
                "ON": "loginCustomer"
            }
        };
        //LOGGING
        // logApiBasic( 
        //     `Request ${head_route_name}${request_namepath} Failed`,
        //     `REQUEST GOT AT : ${time_requested} \n` +
        //     "REQUEST BODY/PARAM : \n" +
        //     JSON.stringify('', null, 2),
        //     JSON.stringify(message, null, 2)
        // );
        pg_client.release();
        res.status(200).json(message);
        return; //END
    }

    //ERROR INVALID USERNAME

    if(result =="INVALID_USERNAME"){
        const message = {
            "message": "Failed",
            "error_key": "error_invalid_username",
            "error_message": "username is wrong or doesn't exist" ,
            "error_data": {
                "ON": "loginCustomer"
            }
        };
        //LOGGING
        // logApiBasic( 
        //     `Request ${head_route_name}${request_namepath} Failed`,
        //     `REQUEST GOT AT : ${time_requested} \n` +
        //     "REQUEST BODY/PARAM : \n" +
        //     JSON.stringify('', null, 2),
        //     JSON.stringify(message, null, 2)
        // );
        pg_client.release();
        res.status(200).json(message);
        return; //END
    }

    //success

    pg_client.release();
    res.status(200).json({"message":"Success","data":result})
    return;

})


//logout customer from middleware
//===============================================================================================
router.post('/logout',middleware,async(req,res)=>{
    
    //Basic Info
    
    let request_namepath = req.path
    let time_requested = moment(Date.now())

    //PARAM

    let cust_id = res.locals.curr_customer_id;

    const pg_client = await pool.connect()

    //logout

    let[success,result] = await logout(pg_client,cust_id)
    
    //FAIL LOGOUT

    if(!success){
        
        console.error(result);
        pg_client.release();
        
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": result,
            "error_data": "ON tryToLogout"
        };
        //LOGGING
        // logApiBasic( 
        //     `Request ${head_route_name}${request_namepath} Failed`,
        //     `REQUEST GOT AT : ${time_requested} \n` +
        //     "REQUEST BODY/PARAM : \n" +
        //     JSON.stringify('', null, 2),
        //     JSON.stringify(message, null, 2)
        // );

        res.status(200).json(message)
        return;
    }

    //success

    pg_client.release();
    res.status(200).json({"message":"Success","data":result})
    return;
})


//refresh token if active token expired
//===============================================================================================
router.post('/refresh_token',async(req,res)=>{
    
    //Basic Info
    
    let request_namepath = req.path
    let time_requested = moment(Date.now())
    
    //validation the body
    
    let joi_template_body = joi.object({
        "refresh_token": joi.string().required(),
    }).required();

    const req_body = req.body
    
    let joi_body_validation = joi_template_body.validate(req_body);

    //ERROR VALIDATION BODY

    if(joi_body_validation.error){
        const message = {
            "message": "Failed",
            "error_key": "error_body",
            "error_message": joi_body_validation.error.stack,
            "error_data": joi_body_validation.error.details
        };
        //LOGGING
        // logApiBasic( 
        //     `Request ${head_route_name}${request_namepath} Failed`,
        //     `REQUEST GOT AT : ${time_requested} \n` +
        //     "REQUEST BODY/PARAM : \n" +
        //     JSON.stringify('', null, 2),
        //     JSON.stringify(message, null, 2)
        // );
        res.status(200).json(message);
        return; //END

    }

    //param

    let refresh = joi_body_validation.value["refresh_token"];


    const pg_client = await pool.connect()

    //VERIVY REFRESH TOKEN

    let[success,result] = await verifyRefreshToken(pg_client,refresh)
    
    //ERROR VERIVY REFRESH TOKEN

    if(!success){  
        
        console.error(result);
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": result,
            "error_data": "ON verivyRefreshToken"
        };
        //LOGGING
        // logApiBasic( 
        //     `Request ${head_route_name}${request_namepath} Failed`,
        //     `REQUEST GOT AT : ${time_requested} \n` +
        //     "REQUEST BODY/PARAM : \n" +
        //     JSON.stringify('', null, 2),
        //     JSON.stringify(message, null, 2)
        // );
        pg_client.release();
        res.status(200).json(message)
        return;
    }

     //ERROR TOKEN EXPIRED

    if(result =="TOKEN_EXPIRED"){ 
        
        console.error(result);
        const message = {
            "message": "Failed",
            "error_key": "error_refresh_token_expired",
            "error_message": "Refresh token is expired, please re-login",
            "error_data": "ON refreshTokenCustomer"
        };
        //LOGGING
        // logApiBasic( 
        //     `Request ${head_route_name}${request_namepath} Failed`,
        //     `REQUEST GOT AT : ${time_requested} \n` +
        //     "REQUEST BODY/PARAM : \n" +
        //     JSON.stringify('', null, 2),
        //     JSON.stringify(message, null, 2)
        // );
        pg_client.release();
        res.status(200).json(message);
        return; //END
    }

    //ERROR INVALID TOKEN

    if(result =="INVALID_TOKEN"){
        
        console.error(result);
        const message = {
            "message": "Failed",
            "error_key": "error_refresh_token_invalid",
            "error_message": "Refresh token is invalid, please re-login",
            "error_data": "ON refreshTokenAuthor"
        };
        //LOGGING
        // logApiBasic( 
        //     `Request ${head_route_name}${request_namepath} Failed`,
        //     `REQUEST GOT AT : ${time_requested} \n` +
        //     "REQUEST BODY/PARAM : \n" +
        //     JSON.stringify('', null, 2),
        //     JSON.stringify(message, null, 2)
        // );
        pg_client.release();
        res.status(200).json(message);
        return; //END
    }
    
    //success

    pg_client.release();
    res.status(200).json({"message":"Success","data":result})
    return;

})


module.exports  = router