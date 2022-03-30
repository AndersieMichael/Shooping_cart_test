/**
 * This function will get all Order_HEADER data from database
 * 
 * @param {*} pg_client pool connection 
 * @returns 
 */
async function getAllOrder_Header(pg_client,current_page,limit){
    let query
    let success
    let result

    try {
        query= `select *
                from order_header
                `

        // APPLY ORDER BY
        query += `  order by order_header_id `;


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
 * This function will get Order_HEADER data BY ORDER_HEADER ID
 * 
 * @param {*} pg_client pool connection 
 * @param {number} order_header_id orderHeader ID
 * @returns 
 */
async function getOrder_HeaderByID(pg_client,order_header_id){
    let query
    let success
    let result

    try {
        query= `select *
                from order_header
                where order_header_id=$1`
        value=[
            order_header_id
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
 * This function will get Order by customer id PAGINATION
 * 
 * @param {*} pg_client pool connection 
 * @param {number} id customer_ID
 * @returns 
 */

async function getOrderByCustomerIdPagination(pg_client,id,current_page,limit){
    let query
    let value
    let success
    let result

    try {
        query= `select * from order_header oh natural join 
                order_detail od  
                where customer_id =$1`
        value=[
            id
        ]
         // APPLY ORDER BY
         query += `   order by order_detail_id `;


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
 * This function will get calculate Order when checkout
 * 
 * @param {*} pg_client pool connection 
 * @param {number} cust_id customer ID
 * @returns 
 */
 async function getCalculateCart(pg_client,cust_id){
    let query
    let success
    let result

    try {
        query= `select sum(price * total) as hasil
                from shooping_cart sc 
                join cart_detail cd  
                on sc.cart_id = cd.cart_id 
                join item i 
                on cd.item_id = i.item_id 
                where customer_id =$1`
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
 * This function will add Order_Header
 * 
 * @param {*} pg_client pool connection 
 * @param {number} cust_id customer ID
 * @param {number} total totalCartSum
 * @returns 
 */

async function addOrder_header(pg_client,cust_id,total){
    let query
    let value
    let success
    let result

    try {
        query= `insert into order_header (customer_id,status,total_price)
                Values($1,false,$2)
                RETURNING order_header_id`
        value=[
            cust_id,
            total
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
 * This function will add Order_Header
 * 
 * @param {*} pg_client pool connection 
 * @param {number} cust_id customer ID
 * @param {number} header_id Order Header ID
 * @returns 
 */

async function addOrder_Detail(pg_client,cart_id,header_id){
    let query
    let value
    let success
    let result

    try {
            query= `WITH moved_rows AS (
                        DELETE FROM cart_detail cd 
                        WHERE cart_id =$1
                        RETURNING $2::integer,item_id,total
                    )
                    INSERT INTO order_detail(order_header_id,item_id,total_pcs) 
                    SELECT * FROM moved_rows;`
        value=[
            cart_id,
            header_id
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
 * This function will calculate update stock
 * 
 * @param {*} pg_client pool connection 
 * @param {number} cust_id customer ID
 * @returns 
 */

 async function getRangeStock(pg_client,cust_id){
    let query
    let value
    let success
    let result

    try {
            query= `SELECT cd.item_id, (stock-total)as hasil
                    from shooping_cart sc 
                    join cart_detail cd  
                    on sc.cart_id = cd.cart_id 
                    join item_catalogue i
                    on i.item_id =cd.item_id 
                    where sc.customer_id =$1;`
        value=[
            cust_id
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
 * This function will update Order_header status
 * 
 * @param {*} pg_client pool connection
 * @param {number} header_id Order Header ID
 * @returns 
 */

async function updateStatus(pg_client,header_id){
    let query
    let value
    let success
    let result

    try {
        query= `update order_header
                set "status" = true
                where order_header_id = $1`
        value=[
            header_id
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
 * This function will count total Order_Header
 * 
 * @param {*} pg_client pool connection 
 * @returns 
 */
 async function CountAllOrderHeader(pg_client){
    let query
    let success
    let result

    try {
        query= `select count(order_header_id)as count
                from order_header `
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
 * This function will count total Order by customer id
 * 
 * @param {*} pg_client pool connection 
 * @returns 
 */
async function CountAllOrderByCustomer(pg_client,id){
    let query
    let success
    let result

    try {
        query= `select count(order_detail_id)as count
                from order_header oh natural join 
                order_detail od  
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

//EXPORTS

exports.getAllOrder_Header = getAllOrder_Header
exports.getCalculateCart = getCalculateCart
exports.addOrder_header = addOrder_header
exports.addOrder_Detail = addOrder_Detail
exports.getRangeStock = getRangeStock
exports.updateStatus = updateStatus
exports.getOrder_HeaderByID = getOrder_HeaderByID
exports.CountAllOrderHeader = CountAllOrderHeader
exports.CountAllOrderByCustomer = CountAllOrderByCustomer
exports.getOrderByCustomerIdPagination = getOrderByCustomerIdPagination