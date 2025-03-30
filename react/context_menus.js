import React from "react";
import { ContextMenu, MenuItem } from "react-contextmenu";

import taskState from "./state";


function cleanEvent(event) {
    event.stopPropagation();
    event.preventDefault();
}


export default class ContextMenus extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            overlay: false,
        }

        this.onShowAnyMenu = this.onShowAnyMenu.bind(this);
        this.onHideAnyMenu = this.onHideAnyMenu.bind(this);
    }


    onShowAnyMenu() {
        this.setState({overlay: true});
    }
    onHideAnyMenu() {
        this.setState({overlay: false});
        taskState.context_menu_source_task = null;
    }


    render() {
        return (
            <>
                {this.state.overlay && (
                    <div className="context-click-away-overlay" onClick={(event) => event.stopPropagation()} />
                )}

                <ContextMenu id="task-context-menu" onShow={this.onShowAnyMenu} onHide={this.onHideAnyMenu}>
                    <MenuItem data={{foo: 'bar'}} onClick={(event, data) => {
                        cleanEvent(event);
                        data.showEditCallback();
                    }}>
                        Edit
                    </MenuItem>

                    <MenuItem divider />

                    <MenuItem data={{foo: 'bar'}} onClick={(event, data) => {
                        cleanEvent(event);
                        data.deleteCallback();
                    }}>
                        Delete
                    </MenuItem>
                </ContextMenu>
            </>
        );
    }
}
