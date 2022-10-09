import { createElement } from './utils.js';

const circle_radius = 278;
// Points must be this far apart to be added to the path
const point_spacing = 15;

class Canvas {
  constructor(id, parent) {
    this.id = id;
    this.parent = parent;
    this.elem = null;
    this.path_group = null;
    this.l1 = null;
    this.l2 = null;
    this.sand_elem = null;
    this.pending_pts = [];
    this.new_pts = [];
    this.last_pt = null;
    this.#create();
  }


  #createBaseShapes() {
    // Create circle representing sand
    this.sand_elem = createElement('circle', this.elem, {
      'cx': '0',
      'cy': '0',
      'r': circle_radius,
      'fill': 'tan',
      'stroke': 'none',
      'id': this.id + '-sand',
    }, 'http://www.w3.org/2000/svg');

    // Create link 1 shape
    this.l1 = createElement('g', this.elem, {
      'id': this.id + '-l1',
    }, 'http://www.w3.org/2000/svg');
    createElement('rect', this.l1, {
      'width': '169',
      'height': '30',
      'rx': '15',
      'x': '-15',
      'y': '-15',
      'fill': 'blue',
      'stroke-width': '3',
      'stroke': 'black',
    }, 'http://www.w3.org/2000/svg');

    // Create link 2 shape
    this.l2 = createElement('g', this.elem, {
      'id': this.id + '-l2',
    }, 'http://www.w3.org/2000/svg');
    createElement('rect', this.l2, {
      'width': '159',
      'height': '20',
      'rx': '10',
      'x': '-10',
      'y': '-10',
      'fill': 'red',
      'stroke-width': '3',
      'stroke': 'black',
    }, 'http://www.w3.org/2000/svg');
    createElement('circle', this.l2, {
      'cx': '139',
      'cy': '0',
      'r': 7,
      'fill': 'silver',
      'stroke-width': '2',
      'stroke': 'black',
    }, 'http://www.w3.org/2000/svg');

    // Create group for input path
    this.path_group = createElement('g', this.elem, {
      'id': this.id + '-path-group',
    }, 'http://www.w3.org/2000/svg');
  }

  #addPathSegment(p1, p2, line_props = {}) {
    // Only add a new path if it is far enough away from the last point
    let diff_y = p1["y"] - p2["y"];
    let diff_x = p1["x"] - p2["x"];
    let dist = Math.sqrt((diff_y * diff_y) + (diff_x * diff_x));
    if (dist < point_spacing)
      return null;

    let new_path = createElement('line', this.path_group, {
      'x1': p1.x.toString(),
      'y1': p1.y.toString(),
      'x2': p2.x.toString(),
      'y2': p2.y.toString(),
      'stroke-width': '2',
      ...line_props,
    }, 'http://www.w3.org/2000/svg');

    return new_path;
  }

  #canvasMouseHandler(event) {
    if (event.type == "click" || (event.type == "mousemove" && event.buttons)) {
      var pt = this.elem.createSVGPoint();
      pt.x = event.clientX;
      pt.y = event.clientY;
      var next_pt = pt.matrixTransform(this.elem.getScreenCTM().inverse());
      if (!this.last_pt) {
        this.last_pt = this.pos;
        this.new_pts.push({
          "x": Number.parseFloat(this.pos["x"].toFixed(2)),
          "y": Number.parseFloat(this.pos["y"].toFixed(2))
        });
        console.log(this.new_pts);
      }

      if (this.#addPathSegment(this.last_pt, next_pt, {'stroke': 'black'})) {
        this.new_pts.push({
          "x": Number.parseFloat(next_pt["x"].toFixed(2)),
          "y": Number.parseFloat(next_pt["y"].toFixed(2))
        });
        this.last_pt = this.new_pts[this.new_pts.length - 1];
      }
    }
  }

  #create() {
    this.elem = createElement('svg', this.parent, {
      'id': this.id,
      'version': '1.1',
      'class': 'svg h-100 w-100',
    }, 'http://www.w3.org/2000/svg');
    this.#createBaseShapes();
    this.resize();
    this.sand_elem.onmousemove = (event) => { this.#canvasMouseHandler(event); };
    this.sand_elem.onclick = (event) => { this.#canvasMouseHandler(event); };
  }

  #updatePaths(pending, complete) {
    // Only update if size changes
    if (pending.length != this.pending_pts.length) {
      this.path_group.innerHTML = '';

      if (complete.length == 0)
        this.last_pt = this.pos;
      else
        this.last_pt = complete[0]

      for (let p of complete.slice(1)) {
        const props = {
          'stroke': 'grey',
        };
        this.#addPathSegment(this.last_pt, p, props);
        this.last_pt = p;
      }

      for (let p of pending) {
        const props = {
          'stroke': 'green',
        };
        this.#addPathSegment(this.last_pt, p, props);
        this.last_pt = p;
      }

      for (let p of this.new_pts) {
        const props = {
          'stroke': 'black',
        };
        this.#addPathSegment(this.last_pt, p, props);
        this.last_pt = p;
      }

      this.pending_pts = pending;
    }
  }

  #updateLinkage(th1, th2) {
    // Length of one link
    const len = 139;

    this.l1.setAttribute("transform", "rotate(" + (180 * th1 / Math.PI).toString() + ")");
    let x2 = len * Math.cos(th1);
    let y2 = len * Math.sin(th1);
    this.l2.setAttribute("transform", "translate(" + x2.toString() + "," + y2.toString() + ") rotate(" + (180 * th2/Math.PI).toString() + ")");
    this.pos = {
      'x': x2 + len * Math.cos(th2),
      'y': y2 + len * Math.sin(th2),
    }
  }

  clear() {
    this.new_pts = [];
  }

  getPoints() {
    return this.new_pts;
  }

  resize() {
    let canvas_h = this.elem.clientHeight;
    let canvas_w = this.elem.clientWidth;
    let size = 700;

    let w = size;
    let h = w * canvas_h / canvas_w;

    if (canvas_h < canvas_w) {
      h = size;
      w = h * canvas_w / canvas_h;
    }
    this.elem.setAttribute('viewBox',
      '-' + (w / 2).toString() + " -" + (h / 2).toString() +
      " " + w.toString() + " " + h.toString());
  }

  update(msg) {
    this.#updateLinkage(msg.position.x, msg.position.y);
    this.#updatePaths(msg['pending-points'], msg['complete-points']);
  }
}

export { Canvas };