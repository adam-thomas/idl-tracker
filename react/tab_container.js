import {observer} from "mobx-react";
import React from "react";

import actions from "./actions";
import navigate from "./navigate";
import taskState from "./state";
import SubtaskList from "./task";
import AutoSizeTextarea from "./textarea";


@observer class TaskColumn extends React.Component {
    constructor(props) {
        super(props);

        this.children_container_ref = React.createRef();

        this.state = {
            field_contents: "",
        }
    }

    addChild(event) {
        event.preventDefault();
        actions.addTask(this.state.field_contents, this.props.task, this.children_container_ref.current);
        this.setState({field_contents: ""});
    }

    handleEnter(event) {
        if(event.key === 'Enter'){
            this.addChild(event);
        }
    }

    close() {
        navigate.toTask(this.props.task.parent);
    }

    render() {
        let task = this.props.task;
        let button_text = taskState.is_mobile ? "+" : "Add";

        return (
            <div className="task-column">
                <div className="heading-wrapper">
                    {this.props.task.parent &&
                        <button key="close" className="close-button" onClick={this.close.bind(this)}>
                            &#10094;
                        </button>
                    }

                    <div key="heading" className="heading">
                        {this.props.task.text || "All Tasks"}
                    </div>
                </div>

                <div key="children" ref={this.children_container_ref} className="child-task-list-wrapper">
                    <SubtaskList key="subtasks" task={task} />
                </div>

                {this.props.task == taskState.active_task &&
                    <div key="add-form" className="task-form-wrapper">
                        <AutoSizeTextarea
                            value={this.state.field_contents}
                            onChange={(event) => this.setState({field_contents: event.target.value})}
                            onKeyPress={this.handleEnter.bind(this)}
                        />
                        <button className="submit" onClick={this.addChild.bind(this)}>{button_text}</button>
                    </div>
                }
            </div>
        );
    }
}


export default {
    TaskColumn,
}
