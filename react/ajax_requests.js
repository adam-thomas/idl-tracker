import $ from "jquery";

import taskState from "./state";


function get(url, success_callback) {
    $.get(url, {}, (return_data) => {
        if (return_data.errors) {
            alert(Object.values(return_data.errors));
        } else {
            success_callback(return_data);
        }
    });
}


function post(url, data, success_callback) {
    let full_data = Object.assign({csrfmiddlewaretoken: taskState.csrf}, data);

    $.post(url, full_data, (return_data) => {
        if (return_data.errors) {
            alert(Object.values(return_data.errors));
        } else {
            success_callback(return_data);
        }
    });
}


export default {
    get,
    post,
}
