import { Canvas } from './modules/canvas.js';
import { Leds } from './modules/leds.js';

// Define global variables for canvas and LEDs
let canvas = null;
let leds = null;

// Keeps track of whether there is a pending path command
const points_cmd_max_len = 50;
let new_points_command = [];

// Handles messages from websocket
function wsMessageHandler(event) {
  let data = JSON.parse(event.data);
  canvas.update(data);
}

// Define websocket connection and communication function
let ws = null;
function websocketLoop()
{
  // Try to connect to websocket server if connection doesn't exist.
  if (!ws) {
    const prom = fetch(location.href).then( (response) => {
      if (response.ok) {
        ws = new WebSocket("ws://" + location.hostname + ":8080", "json");
        // Get divs for hiding/showing
        let controls = document.getElementById('controls-container');
        let loading = document.getElementById('loading-div');

        // Remove WS connection, hide canvas and show loading bar on close
        ws.onclose = () => {
          ws = null;
          controls.style = 'display: none;';
          loading.style = '';
        };

        // Register message handler
        ws.onmessage = wsMessageHandler;

        // Hide loading bar and show canvas on open
        controls.style = '';
        loading.style = 'display: none;';
        // Create new canvas and leds if necessary
        if (!canvas) {
          let canvas_div = document.getElementById('canvas-div');
          canvas = new Canvas('canvas', canvas_div);
        }
        if (!leds) {
          let master_input = document.getElementById('ledColorLink');
          leds = new Leds(canvas.elem, master_input);
        }
      }
    }).catch(() => {});
  } else {
    let out_msg = {};
    // Add LED commands if there are any
    const led_cmds = leds.getCommands();
    if (led_cmds.length > 0) {
      out_msg['leds'] = led_cmds;
    }

    // Add points command if there is any
    const points_len = new_points_command.length;
    if (points_len > 0) {
      if (points_len > points_cmd_max_len) {
        out_msg['points'] = new_points_command.slice(0, points_cmd_max_len);
        new_points_command = new_points_command.slice(points_cmd_max_len);
      } else {
        out_msg['points'] = new_points_command;
        new_points_command = [];
      }
    }

    if (Object.entries(out_msg).length > 0) {
      const msg = JSON.stringify(out_msg);
      ws.send(msg);
    }
  }
}

document.addEventListener('DOMContentLoaded', (event) => {

    setInterval(websocketLoop, 100);

    window.addEventListener('keydown', (event) => {
      switch (event.code) {
        case 'Delete':
          canvas.clear();
          break;
        case 'Enter':
          new_points_command = canvas.getPoints();
          canvas.clear();
          break;
        default:
          break;
      }
    });
});

window.addEventListener('resize', () => { canvas.resize(); });