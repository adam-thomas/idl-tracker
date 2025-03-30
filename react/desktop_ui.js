import DjangoCSRFToken from 'django-react-csrftoken';
import {observer} from "mobx-react";
import React from "react";

import taskState from "./state";
import tab_container from "./tab_container";
import ContextMenus from './context_menus';


@observer export default class DesktopUI extends React.Component {
    renderColumn(task) {
        return (<tab_container.TaskColumn task={task} key={"task_" + task.id} />);
    }


    render() {
        let task_columns = taskState.columns.map(this.renderColumn);

        return (
            <>
                <DjangoCSRFToken key="csrf" />

                <div key="ui" className="desktop-ui idl_tracker">
                    <ContextMenus />

                    <div key="contents" className="task-container-wrapper">
                        {task_columns}
                    </div>
                </div>
            </>
        );
    }
}
