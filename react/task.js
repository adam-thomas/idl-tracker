import $ from "jquery";
import { observer } from "mobx-react";
import React from "react";
import { ContextMenuTrigger } from "react-contextmenu";

import actions from "./actions";
import navigate from "./navigate";
import taskState from "./state";
import AutoSizeTextarea from "./textarea";


@observer export default class SubtaskList extends React.Component {
    render() {
        let task = this.props.task;

        let children = Object.values(task.children);
        children.sort((c1, c2) => c1.sort_order - c2.sort_order);

        return (
            <ul className="child-tasks">
                {children.map(child => {
                    const is_active = taskState.columns.includes(child);

                    return (
                        <li key={child.id} className={`${is_active ? "active" : ""} task-wrapper`}>
                            <Task key="task" task={child} is_active={is_active} />
                        </li>
                    );
                })}
            </ul>
        );
    }
}


@observer class Task extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            edit_mode: false,
            edit_field_contents: this.props.task.text,
            show_hovered: false,
        }
    }

    dragStart() {
        taskState.dragged_item = this.props.task;
    }

    dragEnd() {
        taskState.dragged_item = null;
    }

    activate() {
        navigate.toTask(this.props.task);
    }

    showEditMode() {
        this.setState({edit_mode: true, edit_field_contents: this.props.task.text});
    }

    delete() {
        actions.deleteTask(this.props.task);
    }

    saveEdit() {
        let text = this.state.edit_field_contents;

        if (text === "") {
            actions.deleteTask(this.props.task);
        } else {
            actions.setTaskText(this.props.task, text);
        }

        this.setState({edit_mode: false});
    }

    cancelEdit() {
        this.setState({
            edit_mode: false,
            edit_field_contents: this.props.task.text,
        });
    }

    toggleDone(event) {
        event.stopPropagation();
        actions.setTaskDone(this.props.task, !this.props.task.done);
    }

    handleEscEnter(event) {
        if (event.key === "Enter") {
            this.saveEdit();
        } else if (event.key === "Escape") {
            this.cancelEdit();
        }
    }

    parseTextForURLs(text) {
        // Look through the task's text for any URLs. Return a list of components -
        // either text or <a href> elements.
        const url_index = text.indexOf("http", url_index);

        if (url_index === -1) {
            return [text];
        }

        let result = [text.slice(0, url_index)];

        let space_index = text.indexOf(" ", url_index);
        if (space_index === -1) {
            space_index = text.length;
        }

        const url = text.slice(url_index, space_index);
        result.push(
            <a key={url} onClick={(e) => e.stopPropagation()} href={url} target="_blank">{url}</a>
        );

        // Recur to look for any other URLs.
        const rest_of_text = this.parseTextForURLs(text.slice(space_index));
        return result.concat(rest_of_text);
    }

    renderTaskText() {
        let checkbox_class = "imitation-checkbox";
        if (this.props.task.done) {
            checkbox_class = "checked " + checkbox_class;
        }

        return (
            <ContextMenuTrigger
                id="task-context-menu"
                key="task-text"
                disableIfShiftIsPressed={true}
                holdToDisplay={500}
                collect={(props) => {
                    // This function is called when the context menu is opened, in order to
                    // gather useful data about the thing that opened it. We can also use this
                    // to track that this is the open object.
                    taskState.context_menu_source_task = this.props.task;
                    return {
                        showEditCallback: this.showEditMode.bind(this),
                        deleteCallback: this.delete.bind(this),
                    }
                }}
                attributes={{
                    className: "task-entry",
                    onClick: this.activate.bind(this),
                }}
            >
                <div className="checkbox-wrapper" onClick={this.toggleDone.bind(this)}>
                    <div className={checkbox_class} />
                </div>

                <span className="task-text">{this.parseTextForURLs(this.props.task.text)}</span>

                {Object.keys(this.props.task.children).length > 0 &&
                    <div className="caret-wrapper">
                        <div className="caret" />
                    </div>
                }
            </ContextMenuTrigger>
        );
    }

    renderEditForm() {
        return (
            <div key="add-form" className="edit-form task-entry">
                <AutoSizeTextarea
                    autoFocus={true}
                    value={this.state.edit_field_contents}
                    onChange={(event) => this.setState({edit_field_contents: event.target.value})}
                    onKeyDown={this.handleEscEnter.bind(this)}
                />

                <div className="actions">
                    <button className="submit" onClick={this.saveEdit.bind(this)}>&#128190;</button>
                    <button className="submit" onClick={this.cancelEdit.bind(this)}>&#10006;</button>
                </div>
            </div>
        );
    }

    renderDropzones() {
        if (taskState.is_mobile || (taskState.dragged_item === null)) {
            return null;
        }

        return (
            <div className="dropzone-container">
                <TaskDropzone key="before" zoneType="before" task={this.props.task} />
                <TaskDropzone key="in" zoneType="in" task={this.props.task} />
                <TaskDropzone key="after" zoneType="after" task={this.props.task} />
            </div>
        );
    }

    render() {
        const draggable = !this.state.edit_mode && !taskState.is_mobile;
        const is_context_menu_source = (taskState.context_menu_source_task === this.props.task);

        const className = [
            is_context_menu_source ? "hover-lock" : "",
            this.props.is_active ? "active" : "",
            "main-row",
        ].join(" ");

        return (
            <div
                key="main-row"
                className={className}
                draggable={draggable}
                onDragStart={draggable ? this.dragStart.bind(this) : null}
                onDragEnd={draggable ? this.dragEnd.bind(this) : null}
            >
                {this.state.edit_mode
                    ? this.renderEditForm()
                    : this.renderTaskText()
                }

                {this.renderDropzones()}
            </div>
        );
    }
}


@observer class TaskDropzone extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            highlight: false,
        };
    }


    drop() {
        let operations = {
            "before": taskState.moveTaskBefore,
            "in": taskState.setTaskParent,
            "after": taskState.moveTaskAfter,
        }

        operations[this.props.zoneType](taskState.dragged_item, this.props.task);
        taskState.dragged_item = null;
    }


    dragOver(event) {
        event.preventDefault();
        this.setState({highlight: true});
    }


    dragLeave() {
        this.setState({highlight: false});
    }


    render() {
        if (taskState.dragged_item === null) {
            return null;
        }

        let baseClass = "dropzone " + this.props.zoneType;
        let highlightClass = this.state.highlight ? " highlight" : "";

        return (
            <div
                className={baseClass + highlightClass}
                key={this.props.zoneType}
                onDrop={this.drop.bind(this)}
                onDragOver={this.dragOver.bind(this)}
                onDragLeave={this.dragLeave.bind(this)}
            />
        );
    }
}
