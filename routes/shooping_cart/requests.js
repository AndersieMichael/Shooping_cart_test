//IMPORT
const express = require('express')
const router = express.Router()
const joi = require('joi')
const moment = require("moment")

//logging

const logApiBasic = require('../../utilities/slack').logApiBasic;

//FUNCTION

const getAllCart = require('./functions').getAllCart
const getCartByCustomerId = require('./functions').getCartByCustomerId
const getCartById = require('./functions').getCartById
const getCartDetail = require('./functions').getCartDetail
const addCart_header = require('./functions').addCart_header
const addCart_detail = require('./functions').addCart_detail
const deleteCart = require('./functions').deleteCart
const updateCart = require('./functions').updateCart
const CountAllCart = require('./functions').CountAllCart
const CountAllCartbyID = require('./functions').CountAllCartbyID
const getCartByCustomerIdPagination = require('./functions').getCartByCustomerIdPagination

const checkingStock = require('../Item_Catalogue/functions').checkingStock

const customerById = require('../customer/functions').customerById


//middleware

const middleware = require('../../middleware/middleware').customerMiddlware


//PAGINATION
const PaginatePagesSimple = require('../../paginate').PaginatePagesSimple;

//conection to database

const pool = require('../../utilities/connection').pool

let head_route_name = "/shooping_cart"


//view all cart
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
    if(joi_validation_query.error){
        const message = {
            "message": "Failed",
            "error_key": "error_query",
            "error_message": joi_validation_query.error.stack,
            "error_data": joi_validation_query.error.details
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
        return; //END

    }

    //PARAM
    let current_page = joi_validation_query.value["Page"];
    let limit = joi_validation_query.value["Limit"];


    const pg_client = await pool.connect()

    // get all Cart

    let[success,result] = await getAllCart(pg_client,current_page,limit)

    //ERROR GET ALL Cart

    if(!success){
        
        console.error(result);
        pg_client.release();
        
        //Error Message
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": result,
            "error_data": "ON viewAllCart"
        };
        
        //LOGGING
        logApiBasic( 
            `Request ${head_route_name}${request_namepath} Failed`,
            `REQUEST GOT AT : ${time_requested} \n` +
            "REQUEST BODY/PARAM : \n" +
            JSON.stringify('', null, 2),
            JSON.stringify(message, null, 2)
        );

        res.status(200).json(message)
        return;
    }
    
    //COUNT ALL TOTAL Cart

    let[tsuccess,tresult] = await CountAllCart(pg_client)
    
    //ERROR COUNT ALL TOTAL Cart
    
    if(!tsuccess){

        console.error(tresult);
        pg_client.release();
        
        //Error Message
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": tresult,
            "error_data": "ON calculate Total Cart"
        };
        
        //LOGGING
        logApiBasic( 
            `Request ${head_route_name}${request_namepath} Failed`,
            `REQUEST GOT AT : ${time_requested} \n` +
            "REQUEST BODY/PARAM : \n" +
            JSON.stringify('', null, 2),
            JSON.stringify(message, null, 2)
        );

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


//view cart by id
//===============================================================================================
router.get('/view/:id' , async(req , res)=>{

    //Basic Info
    
    let request_namepath = req.path
    let time_requested = moment(Date.now())
    
    //joi validation param

    let joi_template_param = joi.number().required();

    let joi_validate_param = joi_template_param.validate(req.params.id);
    
    //Error VALIDATION PARAM
    
    if(joi_validate_param.error){
        const message = {
            "message": "Failed",
            "error_key": "error_param",
            "error_message": joi_validate_param.error.stack,
            "error_data": joi_validate_param.error.details
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
        return; //END
    }

    //PARAM

    const cart_id = req.params.id

    const pg_client = await pool.connect()

    //GET CART BY CART ID

    let[success,result] = await getCartById(pg_client,cart_id)

    //ERROR GET CART BY CART ID

    if(!success){
        
        console.error(result);
        pg_client.release();
        
        //Error Message
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": result,
            "error_data": "ON viewCartByID"
        };
        
        //LOGGING
        logApiBasic( 
            `Request ${head_route_name}${request_namepath} Failed`,
            `REQUEST GOT AT : ${time_requested} \n` +
            "REQUEST BODY/PARAM : \n" +
            JSON.stringify('', null, 2),
            JSON.stringify(message, null, 2)
        );

        res.status(200).json(message)
        return;
    }

    //data not found / kosong

    if(result.length === 0){ 
        
        //Error
        
        console.error(result);
        const message = {
            "message": "Failed",
            "error_key": "error_id_not_found",
            "error_message": "Cant found Items with id :: " + items_id.toString(),
            "error_data": {
                "ON": "Item_ID_Exist",
                "ID": items_id
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
        pg_client.release();
        res.status(200).json(message);
        return; //END
    }

    //success

    pg_client.release();
    res.status(200).json({"message":"Success","data":result})
    return;

})


//add cart 
//===============================================================================================
router.post('/add',async(req,res)=>{

    //Basic Info
    
    let request_namepath = req.path
    let time_requested = moment(Date.now())
    
    //validation the body
    
    let joi_template_body = joi.object({
        "cust_id": joi.number().required(),
        "item_id": joi.number().required(), 
        "total": joi.number().required(),
    }).required();

    const req_body = req.body
    
    let joi_body_validation = joi_template_body.validate(req_body);

    //ERROR VALIDATION BODY

    if(joi_body_validation.error){
        const message = {
            "message": "Failed",
            "error_key": "error_param",
            "error_message": joi_body_validation.error.stack,
            "error_data": joi_body_validation.error.details
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
        return; //END

    }

    //PARAM

    let customer_id = joi_body_validation.value["cust_id"];
    let itemid = joi_body_validation.value["item_id"];
    let tstock = joi_body_validation.value["total"];


    const pg_client = await pool.connect()

    //checking customer exist 

    let[csuccess,cresult] = await customerById(pg_client,customer_id)
    
    //checking customer exist  fail

    if(!csuccess){
           
        console.error(cresult);
        pg_client.release();
        
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": cresult,
            "error_data": "ON checkingCUstomerExist"
        };
        //LOGGING
        logApiBasic( 
            `Request ${head_route_name}${request_namepath} Failed`,
            `REQUEST GOT AT : ${time_requested} \n` +
            "REQUEST BODY/PARAM : \n" +
            JSON.stringify('', null, 2),
            JSON.stringify(message, null, 2)
        );

        res.status(200).json(message)
        return;
    }

    //ID tidak ditemukan

    if(cresult.length === 0){ 
        
        //Error
        
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
        logApiBasic( 
            `Request ${head_route_name}${request_namepath} Failed`,
            `REQUEST GOT AT : ${time_requested} \n` +
            "REQUEST BODY/PARAM : \n" +
            JSON.stringify('', null, 2),
            JSON.stringify(message, null, 2)
        );
        pg_client.release();
        res.status(200).json(message);
        return; //END
    }

    //checking stock 

    let[ssuccess,sresult] = await checkingStock(pg_client,itemid)
    
    //checking stock fail

    if(!ssuccess){
           
        console.error(sresult);
        pg_client.release();
        
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": sresult,
            "error_data": "ON CheckingStock"
        };
        //LOGGING
        logApiBasic( 
            `Request ${head_route_name}${request_namepath} Failed`,
            `REQUEST GOT AT : ${time_requested} \n` +
            "REQUEST BODY/PARAM : \n" +
            JSON.stringify('', null, 2),
            JSON.stringify(message, null, 2)
        );

        res.status(200).json(message)
        return;
    }

    //jika stock lebih sedikit dari pada permintaan

    if(sresult[0]["stock"]<tstock){

        console.error("stock to low");
        pg_client.release();

        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": "request Bigger than stock",
            "error_data": "ON stockLow"
        };
        //LOGGING
        logApiBasic( 
            `Request ${head_route_name}${request_namepath} Failed`,
            `REQUEST GOT AT : ${time_requested} \n` +
            "REQUEST BODY/PARAM : \n" +
            JSON.stringify('', null, 2),
            JSON.stringify(message, null, 2)
        );

        res.status(200).json(message)
        return;
    }

    //insert to database

    let[success,result] = await addCart(pg_client,customer_id,itemid,tstock)
    
    //addCart fail

    if(!success){
           
        console.error(result);
        pg_client.release();
        
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": result,
            "error_data": "ON addCart"
        };
        //LOGGING
        logApiBasic( 
            `Request ${head_route_name}${request_namepath} Failed`,
            `REQUEST GOT AT : ${time_requested} \n` +
            "REQUEST BODY/PARAM : \n" +
            JSON.stringify('', null, 2),
            JSON.stringify(message, null, 2)
        );

        res.status(200).json(message)
        return;
    }
    
    //success

    pg_client.release();
    res.status(200).json({"message":"Success","data":result})
    return;
})


// //view cart by middleware
//===============================================================================================
router.get('/viewMiddleware' ,middleware, async(req , res)=>{
       
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
    if(joi_validation_query.error){
        const message = {
            "message": "Failed",
            "error_key": "error_query",
            "error_message": joi_validation_query.error.stack,
            "error_data": joi_validation_query.error.details
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
        return; //END

    }

    //PARAM
    let current_page = joi_validation_query.value["Page"];
    let limit = joi_validation_query.value["Limit"];

    let cust_id = res.locals.curr_customer_id;

    const pg_client = await pool.connect()

    // checking cart id

    let[success,result] = await getCartByCustomerIdPagination(pg_client,cust_id,current_page,limit)
    
    //Error checking cart id

    if(!success){
        
        console.error(result);
        pg_client.release();
        
        //Error Message
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": result,
            "error_data": "ON viewCartByMiddleware"
        };
        
        //LOGGING
        logApiBasic( 
            `Request ${head_route_name}${request_namepath} Failed`,
            `REQUEST GOT AT : ${time_requested} \n` +
            "REQUEST BODY/PARAM : \n" +
            JSON.stringify('', null, 2),
            JSON.stringify(message, null, 2)
        );

        res.status(200).json(message)
        return;
    }

    //data not found / kosong

    if(result.length === 0){ 
        
        //Error
        
        console.error(result);
        const message = {
            "message": "Failed",
            "error_key": "error_data_not_found",
            "error_message": "Cant found order data",
            "error_data": {
                "ON": "viewOrderMiddleware"
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
        pg_client.release();
        res.status(200).json(message);
        return; //END
    }

    //COUNT ALL TOTAL Cart

    let[tsuccess,tresult] = await CountAllCartbyID(pg_client,cust_id)
    
    //ERROR COUNT ALL TOTAL Cart
    
    if(!tsuccess){

        console.error(tresult);
        pg_client.release();
        
        //Error Message
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": tresult,
            "error_data": "ON calculate Total Cart middleware"
        };
        
        //LOGGING
        logApiBasic( 
            `Request ${head_route_name}${request_namepath} Failed`,
            `REQUEST GOT AT : ${time_requested} \n` +
            "REQUEST BODY/PARAM : \n" +
            JSON.stringify('', null, 2),
            JSON.stringify(message, null, 2)
        );

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


//add cart by middleware
//===============================================================================================
router.post('/add/middleware',middleware, async(req,res)=>{

    //Basic Info
    
    let request_namepath = req.path
    let time_requested = moment(Date.now())
    
    //validation the body
    
    let joi_template_body = joi.object({
        "item_id": joi.number().required(), 
        "total": joi.number().required(),
    }).required();

    const req_body = req.body
    
    let joi_body_validation = joi_template_body.validate(req_body);

    //ERROR VALIDATION BODY

    if(joi_body_validation.error){
        const message = {
            "message": "Failed",
            "error_key": "error_param",
            "error_message": joi_body_validation.error.stack,
            "error_data": joi_body_validation.error.details
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
        return; //END

    }

    //PARAM

    let itemid = joi_body_validation.value["item_id"];
    let tstock = joi_body_validation.value["total"];

    let customer_id = res.locals.curr_customer_id;

    let cart_id=0;

    const pg_client = await pool.connect()

    //checking stock 

    let[ssuccess,sresult] = await checkingStock(pg_client,itemid)
    
    //checkingStock fail

    if(!ssuccess){
           
        console.error(sresult);
        pg_client.release();
        
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": sresult,
            "error_data": "ON checkingStock"
        };
        //LOGGING
        logApiBasic( 
            `Request ${head_route_name}${request_namepath} Failed`,
            `REQUEST GOT AT : ${time_requested} \n` +
            "REQUEST BODY/PARAM : \n" +
            JSON.stringify('', null, 2),
            JSON.stringify(message, null, 2)
        );

        res.status(200).json(message)
        return;
    }

    //jika stock lebih sedikit dari pada permintaan

    if(sresult[0]["stock"]<tstock){

        console.error("stock to low");
        pg_client.release();

        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": "request Bigger than stock",
            "error_data": "ON StockLow"
        };
        //LOGGING
        logApiBasic( 
            `Request ${head_route_name}${request_namepath} Failed`,
            `REQUEST GOT AT : ${time_requested} \n` +
            "REQUEST BODY/PARAM : \n" +
            JSON.stringify('', null, 2),
            JSON.stringify(message, null, 2)
        );

        res.status(200).json(message)
        return;
    }

    // checking cart id

    let[csuccess,cresult] = await getCartByCustomerId(pg_client,customer_id)

    //ERROR CHECKING CART ID

    if(!csuccess){
        
        console.error(cresult);
        pg_client.release();
        
        //Error Message
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": cresult,
            "error_data": "ON getCartByCustomerID"
        };
        
        //LOGGING
        logApiBasic( 
            `Request ${head_route_name}${request_namepath} Failed`,
            `REQUEST GOT AT : ${time_requested} \n` +
            "REQUEST BODY/PARAM : \n" +
            JSON.stringify('', null, 2),
            JSON.stringify(message, null, 2)
        );

        res.status(200).json(message)
        return;
    }

    //jika id tidak ditemukan di cart

    if(cresult.length===0){
        
        //bikin cart baru

        let[nsuccess,nresult] = await addCart_header(pg_client,customer_id)
        if(!nsuccess){
            
            //Error
            
            console.error(nresult);
            pg_client.release();
            
            //Error Message
            const message = {
                "message": "Failed",
                "error_key": "error_internal_server",
                "error_message": nresult,
                "error_data": "ON addCart_header"
            };
            
            //LOGGING
            logApiBasic( 
                `Request ${head_route_name}${request_namepath} Failed`,
                `REQUEST GOT AT : ${time_requested} \n` +
                "REQUEST BODY/PARAM : \n" +
                JSON.stringify('', null, 2),
                JSON.stringify(message, null, 2)
            );
    
            res.status(200).json(message)
            return;
        }

        cart_id = nresult[0]["cart_id"]

    }

    //jika cart id sudah ada
    
    else{

        //menggunakan cart id yang sudah ada
        
        cart_id = cresult[0]["cart_id"]
        
        //checking, jika id sama maka ditambah dan end

        for(var data of cresult){
            let item_id,total;
            item_id = data["item_id"];
            total = data["total"];

            if(item_id==itemid){

                tstock = tstock + total

                //update cart data

                let[success,result] = await updateCart(pg_client,cart_id,itemid,tstock)
    
                //update Cart fail

                if(!success){
                    
                    console.error(result);
                    pg_client.release();
                    
                    const message = {
                        "message": "Failed",
                        "error_key": "error_internal_server",
                        "error_message": result,
                        "error_data": "ON updateCart"
                    };
                    //LOGGING
                    logApiBasic( 
                        `Request ${head_route_name}${request_namepath} Failed`,
                        `REQUEST GOT AT : ${time_requested} \n` +
                        "REQUEST BODY/PARAM : \n" +
                        JSON.stringify('', null, 2),
                        JSON.stringify(message, null, 2)
                    );

                    res.status(200).json(message)
                    return;
                }

                //success

                pg_client.release();
                res.status(200).json({"message":"Success","data":result})
                return;//END

            }
        }
    
    }


    //add to cart id dengan orderDetail baru

    let[success,result] = await addCart_detail(pg_client,cart_id,itemid,tstock)
    
    //addCart fail

    if(!success){
           
        console.error(result);
        pg_client.release();
        
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": result,
            "error_data": "ON addCart_detail"
        };
        //LOGGING
        logApiBasic( 
            `Request ${head_route_name}${request_namepath} Failed`,
            `REQUEST GOT AT : ${time_requested} \n` +
            "REQUEST BODY/PARAM : \n" +
            JSON.stringify('', null, 2),
            JSON.stringify(message, null, 2)
        );

        res.status(200).json(message)
        return;
    }
    
    //success

    pg_client.release();
    res.status(200).json({"message":"Success","data":result})
    return;
})


//Update cart by middleware
//===============================================================================================
router.put('/update/middleware',middleware, async(req,res)=>{

    //Basic Info
    
    let request_namepath = req.path
    let time_requested = moment(Date.now())
    
    //validation the body
    
    let joi_template_body = joi.object({
        "item_id": joi.number().required(), 
        "total": joi.number().required(),
    }).required();

    const req_body = req.body
    
    let joi_body_validation = joi_template_body.validate(req_body);
    if(joi_body_validation.error){
        const message = {
            "message": "Failed",
            "error_key": "error_param",
            "error_message": joi_body_validation.error.stack,
            "error_data": joi_body_validation.error.details
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
        return; //END

    }

    //PARAM

    let itemid = joi_body_validation.value["item_id"];
    let tstock = joi_body_validation.value["total"];

    //get cust id from middleware

    let customer_id = res.locals.curr_customer_id;

    const pg_client = await pool.connect()

    //checking cart data

    let[csuccess,cresult] = await getCartByCustomerId(pg_client,customer_id)
    
    //ERROR CHECKING CART

    if(!csuccess){
        
        console.error(cresult);
        pg_client.release();
        
        //Error Message
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": cresult,
            "error_data": "ON viewCartByID"
        };
        
        //LOGGING
        logApiBasic( 
            `Request ${head_route_name}${request_namepath} Failed`,
            `REQUEST GOT AT : ${time_requested} \n` +
            "REQUEST BODY/PARAM : \n" +
            JSON.stringify('', null, 2),
            JSON.stringify(message, null, 2)
        );

        res.status(200).json(message)
        return;
    }

    //Error data not found / kosong

    if(cresult.length === 0){ 
        
        console.error(cresult);
        const message = {
            "message": "Failed",
            "error_key": "error_id_not_found",
            "error_message": "Dont have a cart",
            "error_data": {
                "ON": "cart_ID_Exist"
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
        pg_client.release();
        res.status(200).json(message);
        return; //END
    }

    //get cart_id

    let id = cresult[0]["cart_id"]

    //checking item exist

    let[cdsuccess,cdresult] = await getCartDetail(pg_client,id,itemid)
    
    //ERROR CHECKING CART

    if(!cdsuccess){
        
        console.error(cdresult);
        pg_client.release();
        
        //Error Message
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": cdresult,
            "error_data": "ON viewCartByID"
        };
        
        //LOGGING
        logApiBasic( 
            `Request ${head_route_name}${request_namepath} Failed`,
            `REQUEST GOT AT : ${time_requested} \n` +
            "REQUEST BODY/PARAM : \n" +
            JSON.stringify('', null, 2),
            JSON.stringify(message, null, 2)
        );

        res.status(200).json(message)
        return;
    }

    //Error item not found / kosong

    if(cdresult.length === 0){ 
        
        console.error(cresult);
        const message = {
            "message": "Failed",
            "error_key": "error_id_not_found",
            "error_message": "item is not exist in your cart",
            "error_data": {
                "ON": "ITEM_ID_Exist"
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
        pg_client.release();
        res.status(200).json(message);
        return; //END
    }

    //checking stock 

    let[ssuccess,sresult] = await checkingStock(pg_client,itemid)
    
    //checking stock fail

    if(!ssuccess){
           
        console.error(sresult);
        pg_client.release();
        
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": sresult,
            "error_data": "ON addItem"
        };
        //LOGGING
        logApiBasic( 
            `Request ${head_route_name}${request_namepath} Failed`,
            `REQUEST GOT AT : ${time_requested} \n` +
            "REQUEST BODY/PARAM : \n" +
            JSON.stringify('', null, 2),
            JSON.stringify(message, null, 2)
        );

        res.status(200).json(message)
        return;
    }

    //jika stock lebih sedikit dari pada permintaan

    if(sresult[0]["stock"]<tstock){

        console.error("stock to low");
        pg_client.release();

        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": "request Bigger than stock",
            "error_data": "ON addItem"
        };
        //LOGGING
        logApiBasic( 
            `Request ${head_route_name}${request_namepath} Failed`,
            `REQUEST GOT AT : ${time_requested} \n` +
            "REQUEST BODY/PARAM : \n" +
            JSON.stringify('', null, 2),
            JSON.stringify(message, null, 2)
        );

        res.status(200).json(message)
        return;
    }

    

    //update to database

    let[success,result] = await updateCart(pg_client,id,itemid,tstock)
    
    //update Cart fail

    if(!success){
           
        console.error(result);
        pg_client.release();
        
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": result,
            "error_data": "ON addItem"
        };
        //LOGGING
        logApiBasic( 
            `Request ${head_route_name}${request_namepath} Failed`,
            `REQUEST GOT AT : ${time_requested} \n` +
            "REQUEST BODY/PARAM : \n" +
            JSON.stringify('', null, 2),
            JSON.stringify(message, null, 2)
        );

        res.status(200).json(message)
        return;
    }
    
    //success

    pg_client.release();
    res.status(200).json({"message":"Success","data":result})
    return;
})


//delete item by middleware checking cust id and cart id
//===============================================================================================
router.delete('/delete/middleware',middleware,async(req,res)=>{

    //Basic Info
    
    let request_namepath = req.path
    let time_requested = moment(Date.now())

     //validation the body
    
     let joi_template_body = joi.object({
        "cart_id": joi.number().required(),
    }).required();

    const req_body = req.body
    
    let joi_body_validation = joi_template_body.validate(req_body);
    if(joi_body_validation.error){
        const message = {
            "message": "Failed",
            "error_key": "error_param",
            "error_message": joi_body_validation.error.stack,
            "error_data": joi_body_validation.error.details
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
        return; //END

    }

    //PARAM

    let cart_id = joi_body_validation.value["cart_id"];

     //get cust id from middleware

     let customer_id = res.locals.curr_customer_id;

    const pg_client = await pool.connect()

    // delete Item

    let[success,result] = await deleteCart(pg_client,customer_id,cart_id)
    if(!success){
        
        //Error
        
        console.error(result);
        pg_client.release();
        
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": result,
            "error_data": "ON deleteItem"
        };
        //LOGGING
        logApiBasic( 
            `Request ${head_route_name}${request_namepath} Failed`,
            `REQUEST GOT AT : ${time_requested} \n` +
            "REQUEST BODY/PARAM : \n" +
            JSON.stringify('', null, 2),
            JSON.stringify(message, null, 2)
        );

        res.status(200).json(message)
        return;
    }
    
    //success

    pg_client.release();
    res.status(200).json({"message":"Success","data":result})
    return;
})

module.exports = router