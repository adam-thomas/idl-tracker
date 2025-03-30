
// This file exists to avoid circular imports between taskState and the router definition.
// The router needs to call out to taskState to set the selected task, but actions that
// are handled through the taskState also need to be able to navigate, and the only
// way to do that is using the react hook (useNavigate) or directly via the router
// (https://github.com/remix-run/react-router/issues/9422#issuecomment-1301182219).
// I'm not keen on refactoring the codebase to hooks, so let's try a workaround.

let router;

// This is called (at import time) after defining the router in router.js.
export function setRouter(routerInstance) {
    router = routerInstance;
}

export function toTask(task) {
    if (!task || task.id === null) {
        router.navigate("/");
    } else {
        router.navigate("/" + task.id);
    }
}

export default {
    setRouter,
    toTask,
}
