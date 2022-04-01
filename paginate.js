
/**
 * calculate paginate
 * 
 * @param {data} wanted_data_list data
 * @param {number} current_page page
 * @param {number} limit limit 
 * @param {number} total_data_count total data
 * @returns 
 */

// PAGINATE PAGES
// ===============================================================================
function PaginatePagesSimple(
    wanted_data_list,
    current_page,
    limit,
    total_data_count
){

    let result;

    // PROPERTY NORMALIZATION
    // ------------------------------------------------------
    current_page = Number(current_page)
    limit = limit == undefined || limit == null ? null : Number(limit)
    total_data_count = Number(total_data_count)

    // PREPARE EXTRA PAGINATION DATA
    // ------------------------------------------------------
    let max_page = 1;
    if (limit != null && total_data_count != 0){
        max_page = Math.ceil(total_data_count / limit);
    } 

    // IF CURRENT PAGE > MAX PAGE :: FORCE RETURN EMPTY
    if (current_page > max_page){
        success = true;
        result = {
            "List_Data": [],
            "Pagination_Data": {
                "Current_Page": current_page, //CURRENT ACCESSED PAGE
                "Max_Data_Per_Page": limit, //MAXIMUM DATA VIEWED ON EACH PAGE
                "Max_Page": max_page, //MAXIMUM PAGE AVAILABLE
                "Total_All_Data": total_data_count //TOTAL ALL DATA
            }
        }

        return result; // END
    }

    result = {
        "List_Data": wanted_data_list,
        "Pagination_Data": {
            "Current_Page": current_page,
            "Max_Data_Per_Page": limit,
            "Max_Page": max_page,
            "Total_All_Data": total_data_count
        }
    }

    return result; // END
}


exports.PaginatePagesSimple = PaginatePagesSimple;