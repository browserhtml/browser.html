/*
Manipulate one or more DOM elements.

    attr(element, {hidden: true});
    $('.foo').map(attrs({hidden: true}));
*/

'use strict';

function exists(x) {
  return x != null;
};

function toArray(indexed) {
  return Array.prototype.slice.apply(indexed);
};

// Convert a value, an indexed object of values or null to an array of values.
function unit(x) {
  return !exists(x) ? [] : !exists(x.length) ? [x] : toArray(x);
};

function map(f, elements) {
  return elements.map(f);
};

// Create mapping variant of function
function mapping(f) {
  return function () {
    var rest = toArray(arguments);
    return function (x) {
      return map(function (v) {
        return f.apply(undefined, rest.unshift(v));
      }, unit(x));
    };
  };
};

// Reduce keys and values of an object.
function reducekv(object, next, value) {
  var keys = Object.keys(object);
  for (var i = 0; i < keys.length; i++) value = next(value, keys[i], object[keys[i]]);
  return value;
};

function options(f) {
  return function (element, options) {
    return reducekv(options, f, element);
  };
};

// Set value on object, returning object.
function set(o, k, v) {
  // Test before we set (prevents style recalc in some cases).
  if (o[k] !== v) o[k] = v;
  return o;
};

// Mix an object into another object.
function mix(a, b) {
  return reducekv(b, set, a);
};

// Memoize a single-argument function using a cache object.
// We pass in the cache object explicitly so that we can remove things
// from the cache.
function memoize(f) {
  return function (x, cache) {
    return exists(cache[x]) ? cache[x] : cache[x] = f(x);
  };
};

// A shortcut for `getElementById` that is also memozable.
function byId(id) {
  return document.getElementById(id);
};

function $(selector) {
  return unit(document.querySelectorAll(selector));
};

// Modify attributes on an element
var attr = options(function (element, k, v) {
  if (k === 'style') {
    mix(element[k], v);
  } else if (k === 'className') {
    element.setAttribute('class', v);
  } else if (!exists(v)) {
    element.removeAttribute(k);
  } else {
    element.setAttribute(k, v);
  }
  return element;
});

var attrs = mapping(attr);

function concatClass(string, classname, isSet) {
  return isSet ? string + ' ' + classname : string;
};

function classset(set) {
  return reducekv(set, concatClass, '');
};

function text(element, escaped) {
  return set(element, 'textContent', escaped);
};

var texts = mapping(text);

// Create an html transformer
function html(element, unescaped) {
  return set(element, 'innerHtml', unescaped);
};

var htmls = mapping(html);

function on(element, event, callback) {
  element.addEventListener(event, callback);
  return element;
};

function off(element, event, callback) {
  element.removeEventListener(event, callback);
  return element;
};

function append(parent, child) {
  parent.appendChild(child);
  return parent;
};

function appends(parent, children) {
  return unit(children).reduce(append, parent);
};

function remove(parent, child) {
  parent.removeChild(child);
  return parent;
};

function empty(parent) {
  // Emptying from bottom to top makes for faster reflow.
  while (parent.lastChild) remove(parent, parent.lastChild);
  return parent;
};

function children(parent, childElements) {
  return appends(parent.children.length ? empty(parent) : parent, childElements);
};

function edit(element, attributes, childElements) {
  return children(attr(element, attributes), childElements);
};

function el(tag, attributes, childElements) {
  return edit(document.createElement(tag), attributes, childElements);
};
