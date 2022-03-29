//IMPORT
const express = require('express')
const router = express.Router()
const joi = require('joi')
const moment = require("moment")

//logging

const logApiBasic = require('../../utilities/slack').logApiBasic;

//FUNCTION

const getAllItems = require('./functions').getAllItems
const getItembyID = require('./functions').getItemsById
const checkItemName = require('./functions').checkingItemNameExist
const addItem = require('./functions').addItem
const updateItem = require('./functions').updateItem
const deleteItem = require('./functions').deleteItem
const deleteCatalogueByItemID = require('../Item_Catalogue/functions').deleteCatalogueByItemID
const addItemCatalogue = require('../Item_Catalogue/functions').addItemCatalogue
const updateItemCatalogue = require('../Item_Catalogue/functions').updateItemCatalogueByItemID



//conection to database
const pool = require('../../utilities/connection').pool

let head_route_name = "/Item"

//VIEW ALL ITEM
//===============================================================================================
router.get('/view' , async(req , res)=>{
       
    //Basic Info
    
    let request_namepath = req.path
    let time_requested = moment(Date.now())

    const pg_client = await pool.connect()

    //GET ALL ITEMS
    let[success,result] = await getAllItems(pg_client)

    //ERROR GET ALL ITEMS

    if(!success){
        
        console.error(result);
        pg_client.release();
        
        //Error Message
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": result,
            "error_data": "ON viewAllItem"
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


//VIEW ITEM BY ITEM ID
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

    const items_id = req.params.id
    
    const pg_client = await pool.connect()
    
    //GET ITEM BY ITEM ID

    let[success,result] = await getItembyID(pg_client,items_id)
    
    //ERROR GET ITEM BY ID

    if(!success){
        
        console.error(result);
        pg_client.release();
        
        //Error Message
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": result,
            "error_data": "ON viewItemsByID"
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

    //ERROR (data not found / kosong)

    if(result.length === 0){ 
        
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


//ADD ITEM 
//===============================================================================================
router.post('/add',async(req,res)=>{

    //Basic Info
    
    let request_namepath = req.path
    let time_requested = moment(Date.now())
    
    //validation the body
    
    let joi_template_body = joi.object({
        "name": joi.string().required(),
        "price": joi.number().required(), 
        "stock": joi.number().required(),
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

    let name = joi_body_validation.value["name"];
    let price = joi_body_validation.value["price"];
    let stock = joi_body_validation.value["stock"];


    const pg_client = await pool.connect()

    //CHECKING ITEM NAME

    let[nsuccess,nresult] = await checkItemName(pg_client,name)
        
    //checking ITEM NAME FAIL

    if(!nsuccess){
            
            console.error(nresult);
            pg_client.release();
            
            const message = {
                "message": "Failed",
                "error_key": "error_internal_server",
                "error_message": nresult,
                "error_data": "ON checkingNameExist"
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

    //ERROR ( DATA NAME DUPLICATE)

    if(nresult.length != 0){
            const message = {
                "message": "Failed",
                "error_key": "error_name_duplicate_must_Be_Unique",
                "error_message": "name already registered :: " + name.toString(),
                "error_data": {
                    "ON": "checkingNameExist",
                    "Name": name
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

    //insert to database

    let[success,result] = await addItem(pg_client,name,price)
    
    //add Item fail

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

    //GET ITEM ID

    let item_id = result[0]["item_id"];

    //insert to catalogue

    let[csuccess,cresult] = await addItemCatalogue(pg_client,item_id,stock)
    
    //addItem fail
 
    if(!csuccess){
             
        console.error(cresult);
        pg_client.release();
         
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": cresult,
            "error_data": "ON addItemCatalogue"
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


//UPDATE ITEM BY ITEM ID
//===============================================================================================
router.put('/update/:id',async(req,res)=>{
    
    //Basic Info
    
    let request_namepath = req.path
    let time_requested = moment(Date.now())

    //joi validation param

    let joi_template_param = joi.number().required();

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

        
    //validation the body
    
    let joi_template_body = joi.object({
        "name": joi.string().required(),
        "price": joi.number().required(),
        "stock": joi.number().required(),
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

    let name = joi_body_validation.value["name"];
    let price = joi_body_validation.value["price"];
    let stock = joi_body_validation.value["stock"];

    const item_id = req.params.id


    const pg_client = await pool.connect()

    //checking Item ID

    let[csuccess,cresult] = await getItembyID(pg_client,item_id)

    //ERROR CHECKING ITEM ID

    if(!csuccess){
        
        console.error(cresult);
        pg_client.release();
        
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": cresult,
            "error_data": "ON checkingItemByID"
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

    //ERROR (ID tidak ditemukan)

    if(cresult.length === 0){ 
        
        console.error(cresult);
        const message = {
            "message": "Failed",
            "error_key": "error_id_not_found",
            "error_message": "Cant found data with id :: " + item_id.toString(),
            "error_data": {
                "ON": "Item_ID_Exist",
                "ID": item_id
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

     //send to update data

    let[success,result] = await updateItem(pg_client,item_id,name,price)

     //ERROR SENT TO UPDATE DATA

    if(!success){
         
        console.error(result);
        pg_client.release();
         
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": result,
            "error_data": "ON updateItem"
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

    //send to update stock

    let[icsuccess,icresult] = await updateItemCatalogue(pg_client,item_id,stock)

    //ERROR TO UPDATE STOCK

    if(!icsuccess){
        
        console.error(icresult);
        pg_client.release();
        
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": icresult,
            "error_data": "ON updateItemCatalogue"
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


//delete item by Item id
//===============================================================================================
router.delete('/delete/:id',async(req,res)=>{

    //Basic Info
    
    let request_namepath = req.path
    let time_requested = moment(Date.now())

    //joi validation param

    let joi_template_param = joi.number().required();

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

    const item_id = req.params.id
    
    const pg_client = await pool.connect()

    //checking Item ID

    let[csuccess,cresult] = await getItembyID(pg_client,item_id)

    //ERROR CHECKING ITEM ID

    if(!csuccess){
        
        console.error(cresult);
        pg_client.release();
        
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": cresult,
            "error_data": "ON checkingItemByID"
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

    //ERROR (ID tidak ditemukan)

    if(cresult.length === 0){ 
        
        console.error(cresult);
        const message = {
            "message": "Failed",
            "error_key": "error_id_not_found",
            "error_message": "Cant found data with id :: " + item_id.toString(),
            "error_data": {
                "ON": "Item_ID_Exist",
                "ID": item_id
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

    //delete Item_Catalogue first

    let[isuccess,iresult] = await deleteCatalogueByItemID(pg_client,item_id)

    //ERROR TO DELETE CATALOGUE

    if(!isuccess){
        
        console.error(iresult);
        pg_client.release();
        
        const message = {
            "message": "Failed",
            "error_key": "error_internal_server",
            "error_message": iresult,
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

    // delete Item

    let[success,result] = await deleteItem(pg_client,item_id)

    //ERROR DELETE ITEM

    if(!success){
        
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


module.exports  = router