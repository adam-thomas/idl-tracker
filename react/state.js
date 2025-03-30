import {action, observable, transaction, computed} from "mobx";
import actions from "./actions";


class Task {
    @observable text = "";
    @observable sort_order = 0;
    @observable children = {};
    @observable done = false;

    id = null;
    parent = null;
    parent_id = null;

    constructor(api_data={}) {
        this.text = api_data.text || "";
        this.sort_order = api_data.sort_order || 0;
        this.done = api_data.done || false;

        this.id = api_data.id || null;
        this.parent_id = api_data.parent || null;
    }
}


class TaskState {
    // The root task fakes an item at the head of the tree, which makes it easier to write code
    // without having to write special cases for null parents. All tasks with a parent ID of null
    // in the database will point at this root task.
    // (This is needed instead of just forcing a root node because top-level tasks can be
    // shared between users, so there isn't actually a single consistent root to the tree.)
    @observable root_task = new Task();

    csrf = null;
    @observable active_task = this.root_task;
    @observable screen_width = 0;
    @observable dragged_item = null;
    @observable context_menu_source_task = null;

    // A dictionary of tasks indexed by their database IDs, without the fake root.
    // This can be used for direct lookup.
    @observable tasks_by_id = {};

    // A "cached" task ID, which can be set pre-initialisation. When initialise() is called,
    // if this task ID matches a retrieved task, set that to be the active task; otherwise,
    // do nothing. After initialise(), this value has no effect.
    start_at_task_id = null;

    initialise(tasks) {
        transaction(() => {
            // Fill out tasks_by_id first, so that all the tasks exist for when we're constructing
            // the full tree of parents and children.
            this.tasks_by_id = {};
            for (let task_data of Object.values(tasks)) {
                let task = new Task(task_data);
                this.tasks_by_id[task.id] = task;
            }

            // Then, fill out the parent-child relationships.
            // At this point, the `parent` that comes in from the database is just an ID; replace
            // it with a proper pointer. Fill out each task's list of children as well.
            for (let task of Object.values(this.tasks_by_id)) {
                let parent_obj = (task.parent_id === null) ? this.root_task : this.tasks_by_id[task.parent_id];

                task.parent = parent_obj;
                parent_obj.children[task.id] = task;
            }

            // If a starting task ID was cached, and we have that task available, switch to it now.
            if (this.start_at_task_id !== null) {
                const starting_task = this.tasks_by_id[this.start_at_task_id];
                if (starting_task) {
                    this.active_task = starting_task;
                }
            }
        });
    }


    @computed get hierarchy() {
        // Return a list of tasks, starting from the root and ending with the current active task.
        let result = [this.active_task];

        while (result[0].id !== null) {
            result.unshift(result[0].parent);
        }

        return result;
    }


    @computed get columns() {
        // Return as much of the hierarchy as will fit on the screen, prioritising the lower nodes.
        let width = this.screen_width;
        let num_columns = 1;

        if (width >= 1400) {
            num_columns = 4;
        } else if (width >= 1100) {
            num_columns = 3;
        } else if (width >= 800) {
            num_columns = 2;
        }

        return this.hierarchy.slice(-num_columns);
    }


    @computed get is_mobile() {
        // Return true if we think this is a mobile OS.
        // For now, that's just predicated on screen width.
        return (this.screen_width <= 600);
    }


    // Look up the given task ID, and activate it if it's available.
    @action.bound
    switchToTaskId(task_id) {
        // If the task ID is undefined, select the root.
        if (task_id === undefined || task_id === null) {
            this.active_task = this.root_task;
            return;
        }

        task_id = parseInt(task_id);

        // If no tasks are loaded yet, cache this task ID on the state, so it
        // can be displayed once the tasks are retrieved.
        if (Object.keys(this.tasks_by_id).length === 0) {
            this.start_at_task_id = task_id;
            return;
        }

        // If this task ID does not exist, return to the root task.
        const selected_task = this.tasks_by_id[task_id];
        if (!selected_task) {
            this.active_task = this.root_task;
            return;
        }

        // Otherwise, activate the new task.
        this.active_task = selected_task;
    }


    @action.bound
    addTask(parent, task_data) {
        let new_task = new Task(task_data);
        new_task.parent = parent;

        parent.children[new_task.id] = new_task;
        this.tasks_by_id[new_task.id] = new_task;

        return new_task;
    }


    isAncestor(task, potential_ancestor) {
        // Return true iff `potential_ancestor` is above `task` in the tree, or is `task` itself.
        let parent = task;
        do {
            if (parent.id === potential_ancestor.id) {
                return true;
            }

            parent = parent.parent;
        } while (parent !== null);

        return false;
    }


    @action.bound
    setSortOrder(task, new_value, new_parent=undefined) {
        task.sort_order = new_value;
        actions.moveTask(task, new_value, new_parent);
    }


    // Move a task into another parent, and set its sort_order to be at the end of that parent's
    // list of children.
    @action.bound
    setTaskParent(task, target_parent, skip_save=false) {
        // If `task` is an ancestor of `target_parent`, do nothing - we don't want to move a task
        // inside itself.
        if (this.isAncestor(target_parent, task)) {
            return;
        }

        // Set the moved task's sort_order to be after those of its new siblings.
        let max_sort_order = 0;
        for (let child of Object.values(target_parent.children)) {
            max_sort_order = Math.max(max_sort_order, child.sort_order);
        }
        task.sort_order = max_sort_order + 1;

        // Move `task` from its parent's set of children to `target_parent`'s set of children.
        let original_parent = task.parent;
        delete original_parent.children[task.id];
        target_parent.children[task.id] = task;
        task.parent = target_parent;

        // Tell the API about the changes - both to the sort order and to the parent.
        if (!skip_save) {
            this.setSortOrder(task, max_sort_order + 1, target_parent);
        }
    }


    @action.bound
    moveTaskBefore(task, target_task) {
        // If `task` is an ancestor of `target_task`, do nothing - we don't want to move a task
        // inside itself.
        if (this.isAncestor(target_task, task)) {
            return;
        }

        let target_parent = target_task.parent;

        // If the task being moved isn't in the same level of the hierarchy as the target,
        // update that first.
        if (task.parent !== target_task.parent) {
            this.setTaskParent(task, target_parent, true);
        }

        let new_sort_order = target_task.sort_order;

        if (task.sort_order > target_task.sort_order) {
            // If the task being moved is currently below the target task,
            // move the target and everything in between the two down by one.
            for (let child of Object.values(target_parent.children)) {
                if (child.sort_order < task.sort_order && child.sort_order >= target_task.sort_order) {
                    this.setSortOrder(child, child.sort_order + 1);
                }
            }

        } else {
            // If the task being moved is currently above the target task,
            // move everything between the two (but *not* the target) up by one.
            // Also decrement new_sort_order, so that the moved task comes in above target_task.
            for (let child of Object.values(target_parent.children)) {
                if (child.sort_order > task.sort_order && child.sort_order < target_task.sort_order) {
                    this.setSortOrder(child, child.sort_order - 1);
                }
            }
            new_sort_order--;
        }

        this.setSortOrder(task, new_sort_order, task.parent);
    }


    @action.bound
    moveTaskAfter(task, target_task) {
        // If `task` is an ancestor of `target_task`, do nothing - we don't want to move a task
        // inside itself.
        if (this.isAncestor(target_task, task)) {
            return;
        }

        let target_parent = target_task.parent;

        // If the task being moved isn't in the same level of the hierarchy as the target,
        // update that first.
        if (task.parent !== target_task.parent) {
            this.setTaskParent(task, target_parent, true);
        }

        let new_sort_order = target_task.sort_order;

        if (task.sort_order > target_task.sort_order) {
            // If the task being moved is currently below the target task,
            // move everything in between the two (but not the target) down by one.
            // Also increment new_sort_order, so that the moved task comes in below target_task.
            for (let child of Object.values(target_parent.children)) {
                if (child.sort_order < task.sort_order && child.sort_order > target_task.sort_order) {
                    this.setSortOrder(child, child.sort_order + 1);
                }
            }
            new_sort_order++;

        } else {
            // If the task being moved is currently above the target task,
            // move the target and everything between the two up by one.
            for (let child of Object.values(target_parent.children)) {
                if (child.sort_order > task.sort_order && child.sort_order <= target_task.sort_order) {
                    this.setSortOrder(child, child.sort_order - 1);
                }
            }
        }

        this.setSortOrder(task, new_sort_order, task.parent);
    }
}


let state = new TaskState();
export default state;
