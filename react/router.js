import React from "react";
import { observer } from "mobx-react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import DesktopUI from "./desktop_ui";
import navigate from "./navigate";
import taskState from "./state";

const router = createBrowserRouter([
    {
        path: "/:task_id?",
        element: <DesktopUI />,
        loader: ({ params }) => {
            taskState.switchToTaskId(params.task_id);
            return null;
        },
    },
]);

navigate.setRouter(router);


// A top-level app component, with a route provider.
@observer export class BaseRoutedApp extends React.Component {
    render() {
        return <RouterProvider router={router} />;
    }
}
