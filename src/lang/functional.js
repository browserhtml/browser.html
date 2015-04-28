/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {
  'use strict';

  const compose = (...lambdas) => {
    /**
    Returns the composition of a list of functions, where each function
    consumes the return value of the function that follows. In math
    terms, composing the functions `f()`, `g()`, and `h()` produces
    `f(g(h()))`.
    Usage:

    var square = function(x) { return x * x }
    var increment = function(x) { return x + 1 }

    var f1 = compose(increment, square)
    f1(5) // => 26

    var f2 = compose(square, increment)
    f2(5) // => 36
    **/

    return (...args) => {
      let index = lambdas.length;
      let result = lambdas[--index](...args);
      while (--index >= 0) {
        result = lambdas[index](result);
      }
      return result;
    };
  };

  const partial = (lambda, ...curried) =>
    (...passed) => lambda(...curried, ...passed);

  const curry = (lambda, arity=lambda.length, curried) => {
    /**
    Returns function with implicit currying, which will continue currying until
    expected number of argument is collected. Expected number of arguments is
    determined by `lambda.length` unless it's 0. In later case function will be
    assumed to be variadic and will be curried until invoked with `0` arguments.
    Optionally `arity` of curried arguments can be overridden via second `arity`
    argument.
    ## Examples
       var sum = curry(function(a, b) {
         return a + b
       })
       console.log(sum(2, 2)) // 4
       console.log(sum(2)(4)) // 6
       var sum = curry(function() {
         return Array.prototype.reduce.call(arguments, function(sum, number) {
           return sum + number
         }, 0)
       })
       console.log(sum(2, 2)()) // 4
       console.log(sum(2, 4, 5)(-3)(1)()) // 9
    **/
    return (...passed) => {
      const args = curried ? [...curried, ...passed] : passed;
      return args.length >= arity ? lambda(...args) : curry(lambda, arity, args);
    }
  };

  const arity = (n, f) => (...params) => f(...params.slice(0, n));


  const invokerFrom = (name, object) => (...args) => object[name](...args);
  const invokerOf = name => (object, ...args) => object[name](...args);

  const identity = value => value;

  const constant = value => () => value;

  const True = constant(true);
  const False = constant(false);

  const not = f => (...args) => !f(...args);
  const and = (...ps) => (...params) => ps.every(p => p(...params));
  const or = (...ps) => (...params) => ps.some(p => p(...params));


  const scheduler = task => {
    let isScheduled = false;
    const end = () => isScheduled = false;
    const schedule = () => {
      if (!isScheduled) {
        task(end);
      }
    }
  }


  const throttle = (f, wait, options={}) => {
    let args = null;
    let result = null;
    let timeout = null;
    let previous = 0;
    let {leading, trailing} = options;


    const later = () => {
      previous = leading === false ? 0 : Date.now();
      timeout = null;
      result = f(...args);
      args = null;
    };

    return (...params) => {
      let now = Date.now();
      if (!previous && leading === false) previous = now;
      let remaining = wait - (now - previous);
      args = params;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = f(...args);
        args = null;
      } else if (!timeout && trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  const debounce = (f, wait, immediate) => {
    let timeout = null;
    let args = null;
    let timestamp = null;
    let result = null;

    const later = (...args) => {
      let last = Date.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = f(...args);
          if (!timeout) args = null;
        }
      }
    };

    return (...params) => {
      args = params;
      timestamp = Date.now();
      let callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = f(...args);
        args = null;
      }

      return result;
    }
  }

  exports.compose = compose;
  exports.partial = partial;
  exports.curry = curry;
  exports.arity = arity;
  exports.invokerFrom = invokerFrom;
  exports.invokerOf = invokerOf;
  exports.identity = identity;
  exports.constant = constant;
  exports.True = True;
  exports.False = False;
  exports.not = not;
  exports.and = and;
  exports.or = or;

  exports.throttle = throttle;
  exports.debounce = debounce;
});
