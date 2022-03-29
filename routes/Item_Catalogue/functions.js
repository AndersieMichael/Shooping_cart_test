
/**
 * This function will add Item catalogue
 * 
 * @param {*} pg_client pool connection 
 * @param {number} id Item id
 * @param {number} stock Item stock
 * @returns 
 */

async function addItemCatalogue(pg_client,id,stock){
    let query
    let value
    let success
    let result

    try {
        query= `insert into item_catalogue (item_id,stock)
                Values($1,$2)`
        value=[
            id,
            stock
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
 * This function will update Item Catalogue
 * 
 * @param {*} pg_client pool connection 
 * @param {number} id Item id
 * @param {number} stock Item stock
 * @returns 
 */

async function updateItemCatalogueByItemID(pg_client,item_id,stock){
    let query
    let value
    let success
    let result

    try {
        query= `update item_catalogue
                set "stock" = $2
                where item_id=$1`
        value=[
            item_id,
            stock
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
 * This function will delete the catalogue from Item id
 * 
 * @param {*} pg_client pool connection 
 * @param {number} id Item id 
 * @returns 
 */

async function deleteCatalogueByItemID(pg_client,id){
    let query
    let value
    let success
    let result

    try {
        query= `delete from item_catalogue
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

/**
 * This function will get stock by item_id
 * 
 * @param {*} pg_client pool connection 
 * @param {number} id Item_ID
 * @returns 
 */

 async function checkingStock(pg_client,id){
    let query
    let value
    let success
    let result

    try {
        query= `select stock
                from item_catalogue
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

exports.checkingStock = checkingStock
exports.deleteCatalogueByItemID = deleteCatalogueByItemID
exports.addItemCatalogue = addItemCatalogue
exports.updateItemCatalogueByItemID = updateItemCatalogueByItemID