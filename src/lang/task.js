/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  // Utility function that can be used to resume a generator
  // in a given mode (`next` or `throw`). Result is a function
  // that takes a `value` and resumes `task` in a curried `mode`
  // with a given `value`.
  const resume = (task, mode="next") => value => {
    try {
      return task[mode](value);
    } catch (error) {
      return {error}
    }
  }


  // Utility function takes `routine` generator and arguments
  // that will be start / pass to a generator. Result of calling
  // spawn is a promise that is resolved to a return value of
  // the give generator. spawn will pause / resume generator on
  // `yield`. If yield value is a promise generator is resumed
  // with a value that promise is resolved to or if promise is
  // rejected then generator will be resumed with an exception
  // that will be rejection reason. If exception is thrown / not
  // handled in generator body then returned promise will be
  // rejected with a given exception.
  const spawn = function(task, ...params) {
    return new Promise((resolve, reject) => {
      // start a task by passing arguments to generator, note if generator
      // throws right away it will just reject outer promise.
      const routine = task.call(this, ...params);
      // Create a task resuming functions that resume a generator to capture
      // value it yeilds / returns or an error it throws. `raise` is used to
      // remuse task with a exception and `next` is used to resume it with a
      // `value`.
      const raise = resume(routine, "throw");
      const next = resume(routine, "next");

      // step function takes result captured via one of the resumer functions
      // and either completes result promise of the task with it (rejects if
      // exception was captured or resolves with value if generator returned)
      // or suspends generator until yield value is resolved / rejected and
      // then resumes it with resolution value / rejecetion reason.
      const step = ({done, error, value}) => {
        // If error was captured reject promise.
        if (error) {
          reject(error);
        }
        // If generator is done resolve with a completion value.
        else if (done) {
          resolve(value);
        }
        // Otherwise wrap yield value with promise to wait for tick even
        // if it was not already a promise & resume generator with either
        // reseming funciton and caputre results which then are cycled back
        // onto next step.
        else {
          Promise.
          resolve(value).
          then(next, raise).
          then(step);
        }
      };

      // Resume generator initially with no value and pass on to next step.
      step(next());
    });
  };
  exports.spawn = spawn;

  // Async decorator function takes let you define ES7 like async
  // function (see http://jakearchibald.com/2014/es7-async-functions/)
  // but desugared using generators. `async` must be invoked with a
  // generator function & it will return back pseudo async function.
  // Returned funciton when invoked returns promise that will be resolved
  // to a return value of the decorated generator. Generator can yield
  // promises in which case it's going to be resued with a result of the
  // promise or exception will be thrown into generator if promise is
  // rejected. If exception is throw / not caught in generator body
  // then returned promise will be rejected with that promise.
  const async = task => function(...params) {
    return spawn.call(this, task, ...params);
  };
  exports.async = async;

  // Scheduler can be used to queue up tasks to run them in order they
  // were scheduled but only after task with mathing id is complete.
  const schedule = (id, task, ...params) => {
    const pending = schedule.d[id];
    return schedule.d[id] = spawn(function*() {
      // wait for the scheduled task with matching id to complete before
      // spawning new task.
      try {
        yield pending;
      }
      // spawn a task regardless if previous task completed with error
      // or success. Note we do not catch error here to let it propagate
      // and make devtools handle it more properly.
      finally {
        return spawn(task, ...params);
      }
    });
  };

  // Use `null` prototype to avoid object as a hash map pitfalls
  // see following post for more details:
  // http://www.2ality.com/2012/01/objects-as-maps.html
  schedule.d = Object.create(null);

  exports.schedule = schedule;
});
