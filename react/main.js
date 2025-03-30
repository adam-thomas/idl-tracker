// Required by Webpack Less build
require("../idl_tracker/static/styles/main.less");

import $ from "jquery";
import React from "react";
import ReactDOM from "react-dom";

import ajax_requests from "./ajax_requests";
import taskState from "./state";
import {BaseRoutedApp} from "./router";


// Track the DOM element that React will be added to.
let target;

// Store a pointer to a repeating login health check.
let healthCheckInterval = null;


// Update taskState.screen_width to reflect the current size of the window.
function saveScreenWidth() {
    taskState.screen_width = $(window).width();
}


// Poll the login health check endpoint, and redirect to the login page on
// anything other than a {success: true} response.
function healthCheck() {
    ajax_requests.get("health_check", (data) => {
        if (data.success !== true) {
            window.location = "/accounts/login";
        }
    })
}


// Start the repeating health check. It should fire once every 30 seconds.
function startHealthCheck() {
    healthCheck();

    if (healthCheckInterval === null) {
        healthCheckInterval = setInterval(healthCheck, 30 * 1000);
    }
}


// Stop the health check again.
function stopHealthCheck() {
    if (healthCheckInterval !== null) {
        clearInterval(healthCheckInterval);
        healthCheckInterval = null;
    }
}


// Fill out the taskState and start up the React UI.
function initialise() {
    // Grab the element we're injecting into.
    target = document.getElementById("app");

    // Basic error checking.
    if (!target) {
        console.error("Failed to find an element with id='app'");
        return;
    }

    // Get the tasks from the backend, and initialise the state with them.
    // (This will happen after the app is initially rendered.)
    $.get("/get_tasks", (return_data) => {
        taskState.initialise(return_data);

        // Create the React UI.
        saveScreenWidth();
        ReactDOM.render(<BaseRoutedApp />, target);

        // Get the CSRF token we added, and store it in the state.
        taskState.csrf = $(target).children("input[name=csrfmiddlewaretoken]").val();

        // Reinitialise the UI if the window is resized.
        $(window).resize(saveScreenWidth);
    });

    // Start our login health checks.
    startHealthCheck();
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            startHealthCheck();
        } else {
            stopHealthCheck();
        }
    });
}


// Call initialise() when the page is ready.
$(document).ready(initialise);
