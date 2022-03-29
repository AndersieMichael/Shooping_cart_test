/**
 * This function will get all item data from database
 * 
 * @param {*} pg_client pool connection 
 * @returns 
 */
 async function getAllItems(pg_client){
    let query
    let success
    let result

    try {
        query= `select name,stock
                from item i join item_catalogue ic 
                on i.item_id  = ic.item_id 
                order by i.item_id`

        const temp = await pg_client.query(query)
        if(temp==null || temp==undefined){
            throw new Error(`query Resulted on: ${temp}`)
        }else{
            result= temp.rows
            success = true
        }
    } catch (error) {
        console.log(error.message);
        success=false;
        result=error.message;
    }
    return[success,result]
}

/**
 * This function will get Items by Items id
 * 
 * @param {*} pg_client pool connection 
 * @param {number} id Item_ID
 * @returns 
 */

 async function getItemsById(pg_client,id){
    let query
    let value
    let success
    let result

    try {
        query= `select name,stock
                from item i 
                join item_catalogue ic 
                on i.item_id  = ic.item_id
                where i.item_id=$1`
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
        console.log(error.message);
        success=false;
        result=error.message;
    }
    return[success,result]
}

/**
 * This function will checking Name in Database
 * 
 * @param {*} pg_client pool connection 
 * @param {string} name item name
 * @returns 
 */

 async function checkingItemNameExist(pg_client,name){
    let query
    let value
    let success
    let result

    try {
        query= `select * from item
                where name=$1`
        value=[
            name
        ]
        const temp = await pg_client.query(query,value)
        if(temp==null || temp==undefined){
            throw new Error(`query Resulted on: ${temp}`)
        }else{
            result= temp.rows
            success = true
        }
    } catch (error) {
        console.log(error.message);
        success=false;
        result=error.message;
    }
    return[success,result]
}

/**
 * This function will add Item
 * 
 * @param {*} pg_client pool connection 
 * @param {string} name Item Name
 * @param {number} price Item Price
 * @returns 
 */

async function addItem(pg_client,name,price){
    let query
    let value
    let success
    let result

    try {
        query= `insert into item (name,price)
                Values($1,$2)
                Returning item_id`
        value=[
            name,
            price
        ]
        const temp = await pg_client.query(query,value)
        if(temp==null || temp==undefined){
            throw new Error(`query Resulted on: ${temp}`)
        }else{
            result= temp.rows
            success = true
        }
    } catch (error) {
        console.log(error.message);
        success=false;
        result=error.message;
    }
    return[success,result]
}

/**
 * This function will update Item
 * 
 * @param {*} pg_client pool connection 
 * @param {number} id Item id
 * @param {string} name Item Name
 * @param {number} price Item price
 * @returns 
 */

async function updateItem(pg_client,id,name,price){
    let query
    let value
    let success
    let result

    try {
        query= `update item
                set "name" = $2,
                "price"=$3
                where item_id=$1`
        value=[
            id,
            name,
            price
        ]
        const temp = await pg_client.query(query,value)
        if(temp==null || temp==undefined){
            throw new Error(`query Resulted on: ${temp}`)
        }else{
            result= temp.rows
            success = true
        }
    } catch (error) {
        console.log(error.message);
        success=false;
        result=error.message;
    }
    return[success,result]
}

/**
 * This function will delete the Item from Item id
 * 
 * @param {*} pg_client pool connection 
 * @param {number} id Item id 
 * @returns 
 */

async function deleteItem(pg_client,id){
    let query
    let value
    let success
    let result

    try {
        query= `delete from item
                where item_id=$1`
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
        console.log(error.message);
        success=false;
        result=error.message;
    }
    return[success,result]
}


//EXPORTS

exports.getAllItems = getAllItems
exports.getItemsById = getItemsById
exports.checkingItemNameExist = checkingItemNameExist
exports.addItem = addItem
exports.updateItem = updateItem
exports.deleteItem = deleteItem
