
const ESP_URL = "http://192.168.4.1";

let ledState = false;
let connected = false;
let busy = false;

const ledButton = document.getElementById("ledButton");
const statusText = document.getElementById("status");
const message = document.getElementById("message");

const badge = document.getElementById("connectionBadge");
const connectionText = document.getElementById("connectionText");

const deviceConnection = document.getElementById("deviceConnection");

const refreshButton = document.getElementById("refreshButton");

// Update LED UI
function updateLED() {

    if (ledState) {

        statusText.innerText = "LED ON";
        statusText.className = "status on";

        ledButton.innerText = "TURN OFF";
        ledButton.className = "on";

    } else {

        statusText.innerText = "LED OFF";
        statusText.className = "status off";

        ledButton.innerText = "TURN ON";
        ledButton.className = "off";

    }

}

// Connection UI
function updateConnection(state) {

    connected = state;

    if (connected) {

        badge.className = "badge online";

        connectionText.innerText = "Connected";

        deviceConnection.innerText = "Online";

        deviceConnection.style.color = "#4ade80";

        ledButton.disabled = busy;

        message.innerText = "ESP8266 Connected Successfully";

    } else {

        badge.className = "badge offline";

        connectionText.innerText = "Offline";

        deviceConnection.innerText = "Disconnected";

        deviceConnection.style.color = "#f87171";

        ledButton.disabled = true;

        message.innerText = "Connect to ESP8266 WiFi and retry";

    }

}

// Read LED Status
async function checkStatus() {

    try {

        const controller = new AbortController();

        const timeout = setTimeout(
            () => controller.abort(), 3000
        );

        const response = await fetch(
            ESP_URL + "/status",
            {
                cache: "no-store",
                signal: controller.signal
            }
        );

        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error("Server Error");
        }

        const data = (await response.text()).trim();

        if (data !== "ON" && data !== "OFF") {
            throw new Error("Invalid Status");
        }

        ledState = data === "ON";

        updateLED();

        updateConnection(true);

    } catch (error) {

        updateConnection(false);

    }

}

// Toggle LED
async function toggleLED() {

    if (!connected || busy) return;

    busy = true;

    ledButton.disabled = true;

    message.innerText = "Sending Command...";

    try {

        const response = await fetch(
            ESP_URL + "/toggle",
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error("Command Failed");
        }

        const data = (await response.text()).trim();

        if (data !== "ON" && data !== "OFF") {
            throw new Error("Invalid Response");
        }

        ledState = data === "ON";

        updateLED();

        updateConnection(true);

    } catch (error) {

        updateConnection(false);

        message.innerText = "Command Failed. Retrying...";

        await checkStatus();

    } finally {

        busy = false;

        ledButton.disabled = !connected;

    }

}

// Event Listeners
ledButton.addEventListener("click", toggleLED);

refreshButton.addEventListener("click", checkStatus);

// Automatic connection monitoring
setInterval(checkStatus, 3000);

// App Initialization
function initializeApp() {

    setTimeout(() => {

        document.getElementById("splash")
            .classList.add("hidden");

        document.getElementById("app")
            .classList.remove("hidden");

        checkStatus();

    }, 1200);

}

// Cordova lifecycle
document.addEventListener("deviceready", function () {

    initializeApp();

}, false);

// Browser fallback
if (!window.cordova) {

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initializeApp
        );

    } else {

        initializeApp();

    }

}

// Refresh when app becomes active
document.addEventListener("resume", checkStatus, false);

document.addEventListener("visibilitychange", () => {

    if (!document.hidden) {
        checkStatus();
    }

});
