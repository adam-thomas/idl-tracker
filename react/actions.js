import {transaction} from "mobx";

import ajax_requests from "./ajax_requests";
import navigate from "./navigate";
import taskState from "./state";


function addTask(text, parent, task_list_container=null) {
    let data = {
        text: text,
        parent: parent.id,
    };

    ajax_requests.post("/new", data, (return_data) => {
        taskState.addTask(parent, return_data);

        if (task_list_container) {
            let container_obj = $(task_list_container);
            container_obj.scrollTop(container_obj[0].scrollHeight);
        }
    });
}


function deleteTask(task) {
    let data = {
        id: task.id,
        parent: task.parent.id,
    };

    ajax_requests.post("/delete", data, () => {
        transaction(() => {
            if (taskState.hierarchy.includes(task)) {
                navigate.toTask(task.parent);
            }

            let parent_children = task.parent.children;
            delete parent_children[task.id];
            delete taskState.tasks_by_id[task.id];
        });
    });
}


function editTask(task, data, callback) {
    const base_data = {
        id: task.id,
        text: task.text,
        sort_order: task.sort_order,
        parent: task.parent.id,
    }
    data = Object.assign(base_data, data)

    ajax_requests.post("/edit", data, callback);
}


function setTaskText(task, text) {
    let data = {
        text: text,
    };

    editTask(task, data, (return_data) => {
        task.text = return_data.text;
    });
}


function setTaskDone(task, done) {
    let data = {
        id: task.id,
        done: done,
    };

    ajax_requests.post("/done", data, (return_data) => {
        task.done = return_data.done;
    });
}


function moveTask(task, new_sort_order, new_parent=undefined) {
    let data = {sort_order: new_sort_order};

    if (new_parent !== undefined) {
        data.parent = new_parent.id;
    }

    editTask(task, data, () => {});
}


export default {
    addTask,
    deleteTask,
    setTaskText,
    setTaskDone,
    moveTask,
}
