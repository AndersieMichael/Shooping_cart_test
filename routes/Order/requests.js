//IMPORT
const express = require('express')
const router = express.Router()
const joi = require('joi')
const moment = require("moment")

//logging

const logApiBasic = require('../../utilities/slack').logApiBasic;

//FUNCTION

const viewAllOrder_Header = require('./functions').getAllOrder_Header;
const getCalculateTotal = require('./functions').getCalculateCart;
const addOrderHeader = require('./functions').addOrder_header;
const addOrderDetail = require('./functions').addOrder_Detail;
const calculateStock = require('./functions').getRangeStock;
const updateStatus = require('./functions').updateStatus;
const viewOrderHeaderByID = require('./functions').getOrder_HeaderByID;
const CountAllOrder = require('./functions').CountAllOrderHeader;
const CountAllOrderByID = require('./functions').CountAllOrderByCustomer;
const getOrderByCustomerIdPagination = require('./functions').getOrderByCustomerIdPagination;


const getCartByCustomerId = require('../shooping_cart/functions').getCartByCustomerId

const checkingStock = require('../Item_Catalogue/functions').checkingStock
const updateItemCatalogueByItemID = require('../Item_Catalogue/functions').updateItemCatalogueByItemID

//middleware

const middleware = require('../../middleware/middleware').customerMiddlware


//PAGINATION
const PaginatePagesSimple = require('../../paginate').PaginatePagesSimple;


//conection to database

const pool = require('../../utilities/connection').pool

let head_route_name = "/Order_Header"

//view all Order_Header
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

    // get all orderHeader

    let[success,result] = await viewAllOrder_Header(pg_client,current_page,limit)

    //ERROR GET ORDER_HEADER

    if(!success){
        
        console.error(result);
        pg_client.release();
        
        //Error Message
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": result,
            "error_data": "ON viewAllOrder_Header"
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
    //COUNT ALL TOTAL Order

    let[tsuccess,tresult] = await CountAllOrder(pg_client)
    
    //ERROR COUNT ALL TOTAL Order
    
    if(!tsuccess){

        console.error(tresult);
        pg_client.release();
        
        //Error Message
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": tresult,
            "error_data": "ON calculate Total Order"
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

//add Order
//===============================================================================================
router.post('/add',middleware, async(req,res)=>{

    //Basic Info
    
    let request_namepath = req.path
    let time_requested = moment(Date.now())
    
    //param

    let customer_id = res.locals.curr_customer_id;

    let cart_id;

    const pg_client = await pool.connect();

    //get all cart with customer id

    let[checkSuccess,checkSresult] = await getCartByCustomerId(pg_client,customer_id)
    
        //get cart by customer id fail
        
        if(!checkSuccess){
                   
            console.error(checkSresult);
            pg_client.release();
            
            const message = {
                "message": "Failed",
                "error_key": "error_internal_server",
                "error_message": checkSresult,
                "error_data": "ON get cart by cust id"
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

        //looping with (for of) for checking all stock data is available or not
        
        for(var data of checkSresult){
            let item_id,tstock=0;
            item_id = data["item_id"];
            tstock = data["total"];

            //checking stock 

            let[ssuccess,sresult] = await checkingStock(pg_client,item_id)
        
            //checkingStock fail
            
            if(!ssuccess){
                    
                console.error(sresult);
                pg_client.release();
                
                const message = {
                    "message": "Failed",
                    "error_key": "error_internal_server",
                    "error_message": sresult,
                    "error_data": "ON Checking Stock"
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
                    "error_message": "request Bigger than stock on Item_id : " + item_id.toString(),
                    "error_data": "ON stock to low"
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
            
        }

        cart_id = checkSresult[0]["cart_id"]
        
        //get cart by customer id already calculate

        let[csuccess,cresult] = await calculateStock(pg_client,customer_id)

        //get cart Already Calculate error

        if(!csuccess){
     
            console.error(cresult);
            pg_client.release();
            
            //Error Message
            const message = {
                "message": "Failed",
                "error_key": "error_internal_server",
                "error_message": cresult,
                "error_data": "ON GetCartAlreadyCalculate"
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

        //looping with (for of) update the stock in item catalogue
        
        for(var data of cresult){
            let total, item_id=0;
            total = data["hasil"];
            item_id = data["item_id"];

            //update stock
            
            let[usuccess,uresult] = await updateItemCatalogueByItemID(pg_client,item_id,total)

            //Update Stock error

            if(!usuccess){
         
                console.error(uresult);
                pg_client.release();
                
                //Error Message
                const message = {
                    "message": "Failed",
                    "error_key": "error_internal_server",
                    "error_message": uresult,
                    "error_data": "ON updateItemCatalogueByItemID"
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
        }

        


    //calculate all cart from checkout

    let[tsuccess,tresult] = await getCalculateTotal(pg_client,customer_id)
    
    //checking fail

    if(!tsuccess){
           
        console.error(tresult);
        pg_client.release();
        
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": tresult,
            "error_data": "ON calculateCart"
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

    //get calculate result

    let total = tresult[0]["hasil"]


    //add Order HEADER to Database

    let[ohsuccess,ohresult] = await addOrderHeader(pg_client,customer_id,total)
    
    //add Order HEADER fail

    if(!ohsuccess){
           
        console.error(ohresult);
        pg_client.release();
        
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": ohresult,
            "error_data": "ON add Order Header"
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

    //get order_header_id already create

    let header_id = ohresult[0]["order_header_id"]

    //add Order DETAIL

    let[success,result] = await addOrderDetail(pg_client,cart_id,header_id)
    
    //add Order Detail fail

    if(!success){
           
        console.error(result);
        pg_client.release();
        
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": result,
            "error_data": "ON add Order Detail"
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

//change status
//===============================================================================================
router.get('/status' , async(req , res)=>{
       
    //Basic Info
    
    let request_namepath = req.path
    let time_requested = moment(Date.now())

    //validation the body
    
    let joi_template_body = joi.object({
        "order_header_id": joi.number().required(),
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

    let header_id = joi_body_validation.value["order_header_id"];

    const pg_client = await pool.connect()

    // get orderHeader BY ID

    let[osuccess,oresult] = await viewOrderHeaderByID(pg_client,header_id)

    //ERROR GET ORDER_HEADER BY ID

    if(!osuccess){
        
        console.error(oresult);
        pg_client.release();
        
        //Error Message
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": oresult,
            "error_data": "ON checkingOrderID"
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

     // ERROR (data not found / kosong)

     if(oresult.length === 0){ 
        
        //Error
        
        console.error(oresult);
        const message = {
            "message": "Failed",
            "error_key": "error_id_not_found",
            "error_message": "Cant found order with id :: " + header_id.toString(),
            "error_data": {
                "ON": "Order_header_id_Exist",
                "ID": header_id
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

    // update order header status

    let[success,result] = await updateStatus(pg_client,header_id)

    //ERROR UPDATE STATUS

    if(!success){
        
        //Error
        
        console.error(result);
        pg_client.release();
        
        //Error Message
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": result,
            "error_data": "ON updateStatus"
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

// //view Order by middleware
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

    // get Order id

    let[success,result] = await getOrderByCustomerIdPagination(pg_client,cust_id,current_page,limit)
    
    //Error get Order id

    if(!success){
        
        console.error(result);
        pg_client.release();
        
        //Error Message
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": result,
            "error_data": "ON getOrderID"
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

    //COUNT ALL TOTAL Order

    let[tsuccess,tresult] = await CountAllOrderByID(pg_client,cust_id)
    
    //ERROR COUNT ALL TOTAL Order
    
    if(!tsuccess){

        console.error(tresult);
        pg_client.release();
        
        //Error Message
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": tresult,
            "error_data": "ON calculate Total Order middleware"
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


module.exports = router