// This helper function creates an element, appends it to its parent,
// and sets all provided attributes.
function createElement(type, parent, attrs, ns=null) {
  let elem = null;
  if (ns)
    elem = document.createElementNS(ns, type);
  else
    elem = document.createElement(type);

  for (var key in attrs) {
    elem.setAttribute(key, attrs[key]);
  }

  if (parent)
    parent.appendChild(elem);

  return elem;
}


export { createElement };