


/**
 * This function will get all customer data from database
 * 
 * @param {*} pg_client pool connection 
 * @returns 
 */
 async function getAllCustomer(pg_client,current_page,limit){
    let query
    let success
    let result

    try {
        query= `select customer_id,name,username,password,phone_number
                from customer`

        // APPLY ORDER BY
        query += `  order by customer_id asc `;


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
 * This function will get customer by customer id
 * 
 * @param {*} pg_client pool connection 
 * @param {number} id customerID
 * @returns 
 */

 async function getCustomerById(pg_client,id){
    let query
    let value
    let success
    let result

    try {
        query= `select customer_id,name,username,password,phone_number
                from customer
                where customer_id=$1`
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
 * This function will add customer
 * 
 * @param {*} pg_client pool connection 
 * @param {string} name customer Name
 * @param {string} phone customer phone
 * @param {string} username customer username
 * @param {string} password customer password already encrypt
 * @returns 
 */

 async function addCustomer(pg_client,name,phone,username,password){
    let query
    let value
    let success
    let result

    try {
        query= `insert into customer (name,phone_number,username,password)
                Values($1,$2,$3,$4)`
        value=[
            name,
            phone,
            username,
            password
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
 * This function will update customer
 * 
 * @param {*} pg_client pool connection 
 * @param {number} id customer id
 * @param {string} name customer Name
 * @param {string} phone customer phone
 * @param {string} username customer username
 * @param {string} password customer password already encrypt
 * @returns 
 */

async function updateCustomer(pg_client,id,name,phone,username,password){
    let query
    let value
    let success
    let result

    try {
        query= `update customer
                set "name" = $2,
                "phone_number"=$3,
                "username"=$4,
                "password"=$5
                where customer_id=$1`
        value=[
            id,
            name,
            phone,
            username,
            password
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
 * @param {string} username customer username 
 * @returns 
 */

 async function checkingUsernameExist(pg_client,username){
    let query
    let value
    let success
    let result

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
    } catch (error) {
        console.log(error.message);
        success=false;
        result=error.message;
    }
    return[success,result]
}

/**
 * This function will delete the customer by customer id
 * 
 * @param {*} pg_client pool connection 
 * @param {number} id customer id 
 * @returns 
 */

 async function deleteCustomer(pg_client,id){
    let query
    let value
    let success
    let result

    try {
        query= `delete from customer
                where customer_id=$1`
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
 * This function will get count total customer
 * 
 * @param {*} pg_client pool connection 
 * @returns 
 */
async function CountAllCustomer(pg_client){
    let query
    let success
    let result

    try {
        query= `select count(customer_id)as count
                from customer `
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


//EXPORTS

exports.getAllCustomer = getAllCustomer
exports.customerById = getCustomerById
exports.addCustomer = addCustomer
exports.updateCustomer = updateCustomer
exports.checkingUsername = checkingUsernameExist
exports.deleteCustomer = deleteCustomer
exports.CountAllCustomer = CountAllCustomer
