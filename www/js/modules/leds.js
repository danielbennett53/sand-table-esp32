import { createElement } from './utils.js'

const led_radius = 300;
const num_leds = 20;
// Arc swept by one LED
const led_arc = 2 * Math.PI / num_leds;
// Get bitmask for all leds
let all_leds = 0;
for (let l = 0; l < num_leds; ++l) {
  all_leds += (1 << l);
}

// This class creates and manages a series of paths on the canvas defined in
// parent. The paths create a circle of clickable arcs corresponding to each
// LED. Each LED can be clicked and changed individually.
class Leds {
  constructor(parent, master_input) {
    this.parent = parent;
    this.master_input = master_input;
    this.leds = [];
    // Keep track of most recent commands
    this.commands = [];
    this.create();
  }

  create() {
    let led_group = createElement('g', this.parent, {
      'id': 'led-group',
    }, 'http://www.w3.org/2000/svg');

    // This div is not displayed, and holds all inputs for LED colors
    let hidden_div = createElement('div', document.body, {
      'style': 'display: none;',
      'id': 'led-hidden-div',
    });

    // Add the input for the master LED control
    let hidden_master_input = createElement('input', hidden_div, {
      'type': 'color',
      'id': 'led-all',
    });

    // Add inputs and paths for every LED
    for (let i = 0; i < num_leds; ++i) {
      const phi = i * 2 * Math.PI / num_leds;
      const sx = led_radius * Math.cos(phi);
      const sy = led_radius * Math.sin(phi);
      const ex = led_radius * Math.cos(phi + led_arc);
      const ey = led_radius * Math.sin(phi + led_arc);

      let new_path = createElement('path', led_group, {
        'd': `M ${sx} ${sy} A ${led_radius} ${led_radius} 0 0 1 ${ex} ${ey}`,
        'stroke': 'black',
        'stroke-width': '15',
        'fill': 'none',
      }, 'http://www.w3.org/2000/svg');

      let new_input = createElement('input', hidden_div, {
          'type': 'color',
        });

      new_input.addEventListener("input", (event) => {
        new_path.setAttribute("stroke", event.target.value);
        this.addCommand(1 << i, event.target.value);
      });

      new_path.onclick = () => { new_input.click(); };

      this.leds.push({
        'path': new_path,
        'input': new_input,
      });
    }

    // Make it so that the given master input triggers this input
    this.master_input.onclick = () => { hidden_master_input.click(); };
    hidden_master_input.addEventListener('input', (event) => {
      for (let lp of this.leds) {
        lp['input'].value = event.target.value;
        lp['path'].setAttribute('stroke', event.target.value);
      }

      this.addCommand(all_leds, event.target.value);
    });
  }

  // Updates LEDs from an input array (feedback from hardware, not user input)
  update(leds) {
    for (let i = 0; i < leds.length; ++i) {
      this.leds[i]['input'].value = leds[i];
      this.leds[i]['path'].setAttribute('stroke', leds[i]);
    }
  }

  // Adds a new led command to the list, editing previous commands if outdated
  addCommand(bitmask, color) {
    for (let i = 0; i < this.commands.length; ++i) {
      let bm = this.commands[i]['bitmask'];
      // If XOR == OR, there is no overlap
      if ((bm ^ bitmask) != (bm | bitmask)) {
        // Remove all bits from old command that are repeated in new command
        this.commands[i]['bitmask'] = (bm & bitmask) ^ bm;
      }

      // Remove empty elements from the commands array
      if (this.commands[i]['bitmask'] == 0) {
        this.commands.splice(i, 1);
        --i;
      }
    }

    // Add the new command
    this.commands.push({
      'bitmask': parseInt(bitmask),
      'color': parseInt(color.substring(1), 16),
    });
  }

  // Return any current commands
  getCommands() {
    let out = this.commands;
    this.commands = [];
    return out;
  }
}

export { Leds };