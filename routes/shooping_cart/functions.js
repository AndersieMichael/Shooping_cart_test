/**
 * This function will get all Cart data from database
 * 
 * @param {*} pg_client pool connection 
 * @returns 
 */
 async function getAllCart(pg_client,current_page,limit){
    let query
    let success
    let result

    try {
        query= `select *
                from shooping_cart
               `

        // APPLY ORDER BY
        query += `   order by cart_id `;


        // LIMIT 
        if(limit){
            query += ` LIMIT ${limit} `;
        }
        

        // OFFSET 
        let offset = limit * Math.max(((current_page || 0) - 1), 0);
        query += ` OFFSET ${offset} `;
        
        //EXECUTE QUERY
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
 * This function will get Cart by customer id
 * 
 * @param {*} pg_client pool connection 
 * @param {number} id customer_ID
 * @returns 
 */

async function getCartByCustomerId(pg_client,id){
    let query
    let value
    let success
    let result

    try {
        query= `select * from shooping_cart sc natural join 
                cart_detail cd 
                where customer_id =$1
                order by cart_detail_id `
        value=[
            id
        ]
    
         //EXECUTE QUERY
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
 * This function will get Cart by customer id PAGINATION
 * 
 * @param {*} pg_client pool connection 
 * @param {number} id customer_ID
 * @returns 
 */

 async function getCartByCustomerIdPagination(pg_client,id,current_page,limit){
    let query
    let value
    let success
    let result

    try {
        query= `select * from shooping_cart sc natural join 
                cart_detail cd 
                where customer_id =$1`
        value=[
            id
        ]
         // APPLY ORDER BY
         query += `   order by cart_detail_id `;


         // LIMIT 
         if(limit){
             query += ` LIMIT ${limit} `;
         }
         
 
         // OFFSET 
         let offset = limit * Math.max(((current_page || 0) - 1), 0);
         query += ` OFFSET ${offset} `;
         
         //EXECUTE QUERY
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
 * This function will get Cart_detail 
 * 
 * @param {*} pg_client pool connection 
 * @param {number} cartid cart_id
 * @param {number} itemid item_id 
 * @returns 
 */

 async function getCartDetail(pg_client,cartid,itemid){
    let query
    let value
    let success
    let result

    try {
        query= `select * from  cart_detail cd 
                where cart_id =$1 and item_id = $2`
        value=[
            cartid,
            itemid
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
 * This function will get Cart by cart id
 * 
 * @param {*} pg_client pool connection 
 * @param {number} id cart_ID
 * @returns 
 */

async function getCartById(pg_client,id){
    let query
    let value
    let success
    let result

    try {
        query= `select * from shooping_cart
                where cart_id=$1`
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
 * This function will add Cart header
 * 
 * @param {*} pg_client pool connection 
 * @param {*} cust_id customer ID
 * @param {*} item_id items_ID
 * @param {*} stock total stock
 * @returns 
 */

async function addCart_header(pg_client,cust_id){
    let query
    let value
    let success
    let result

    try {
        query= `insert into shooping_cart (customer_id)
                Values($1)
                RETURNING cart_id`
        value=[
            cust_id,
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
 * This function will add Cart detail
 * 
 * @param {*} pg_client pool connection 
 * @param {*} cust_id customer ID
 * @param {*} item_id items_ID
 * @param {*} stock total stock
 * @returns 
 */

async function addCart_detail(pg_client,cart_id,item_id,stock){
    let query
    let value
    let success
    let result

    try {
        query= `insert into cart_detail (cart_id,item_id,total)
                Values($1,$2,$3)`
        value=[
            cart_id,
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
 * This function will update Cart
 * 
 * @param {*} pg_client pool connection 
 * @param {*} cart_id cart ID
 * @param {*} cust_id customer ID
 * @param {*} item_id items_ID
 * @param {*} stock total stock
 * @returns 
 */

 async function updateCart(pg_client,cart_id,item_id,stock){
    let query
    let value
    let success
    let result

    try {
        query= `update cart_detail 
                set "total" = $3
                where cart_id = $1 and item_id = $2`
        value=[
            cart_id,
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
 * This function will delete the catalogue 
 * 
 * @param {*} pg_client pool connection 
 * @param {number} custid cust id 
 * @param {number} cartid Item id 
 * @returns 
 */

 async function deleteCart(pg_client,custid,cartid){
    let query
    let value
    let success
    let result

    try {
        query= `delete from shooping_cart
                where cart_id=$2 and customer_id=$1`
        value=[
            custid,
            cartid
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
 * This function will count total Cart
 * 
 * @param {*} pg_client pool connection 
 * @returns 
 */
 async function CountAllCart(pg_client){
    let query
    let success
    let result

    try {
        query= `select count(cart_id)as count
                from shooping_cart `
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
 * This function will count total Cart
 * 
 * @param {*} pg_client pool connection 
 * @param {number} id customer id
 * @returns 
 */
 async function CountAllCartbyID(pg_client,id){
    let query
    let success
    let result

    try {
        query= `select count(cart_detail_id)as count
                from shooping_cart sc natural join 
                cart_detail cd 
                where customer_id =$1`
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

exports.getAllCart = getAllCart
exports.getCartByCustomerId = getCartByCustomerId
exports.getCartById = getCartById
exports.getCartDetail = getCartDetail
exports.addCart_header = addCart_header
exports.addCart_detail = addCart_detail
exports.deleteCart = deleteCart
exports.updateCart = updateCart
exports.CountAllCart = CountAllCart
exports.CountAllCartbyID = CountAllCartbyID
exports.getCartByCustomerIdPagination = getCartByCustomerIdPagination
