# Architecture overview

This document outlines the general architecture you will see used in [browser.html][browser.html] implementation. Foundation of this architecture has being encoded in a [reflex][reflex] library that is a thin wrapper over [react][] enforcing described architecture.

This document will illustrate a very simple architecture pattern that serves as an infinitely nestable building block. It is great for modularity, code reuse, and testing. Ultimately, this pattern makes it easy to solve complex problems in a way that stays modular. For the illustration purposes we will start with the basic pattern in a small example and build on those core principles.

## The Basic Pattern

The logic of every program will break up into cleanly separated parts: **model**, **update** and **view**. You can pretty reliably start with the following skeleton and then iteratively fill in details for your particular case.

```js
// Model

const Model = Record({ /*...*/ });

// Actions

const Reset = Record({id: Number});
/*...*/
const Action = Union(Reset/*, ...*/);
// Update

const update = (model, action) =>
  // If `Reset` action reset the model.
  action instanceof Reset ? model.clear() :
  // If unknown action just keep things as is.
  model;

// View

const view = (model, address) =>
  html.div({ /*...*/ });
```

## Example: Counter

First example is a simple counter that can be incremented or decremented. You can also see this [example in action][single counter example].

This code starts with a very simple model. We just need to keep track of a number `value` of the counter:

```js
// Model
export const Model = Record({value: Number});
```

When it comes to updating a model, things are relatively simple again. We define a set of actions that may be performed and an `update` function to actually perform those actions:

```js
// Actions
export const Increment = Record({label: '+'});
export const Decrement = Record({label: '-'});
export const Action = Union(Increment, Decrement);

// Update
export const update = (model, action) =>
  action instanceof Increment ? model.update('value', x => x + 1) :
  action instanceof Decrement ? model.update('value', x => x - 1) :
  model;
```

Notice that our action types do not do anything, they simply describe actions that are possible. This is important as this leaves decision on how to react to those actions up to an embedder of a counter. For example user may choose to have max `value` that counter can not exceed and there for ignore `Incerement` actions when value is at max.

This also allows users to add more actions, for example they may decides that counter should be doubled when a certain button is pressed, that will be a new action type. This means our code ends up being very clear about how our model can be transformed. Anyone reading this code will immediately know what is allowed and what is not. Furthermore, they will know exactly how to add new features in a consistent way.

Finally, we create a way to `view` our counter. In this example we create a `div` that contains: a decrement `button`, a `span` showing the current count, and an increment `button`.

```js
// Style
const conterStyles = {
  value: {
    fontWeight: 'bold'
  }
};

// View
export const view = (model, address) => {
  return html.span({key: 'counter'}, [
    html.button({
      key: 'decrement',
      onClick: address.pass(Decrement)
    }, ["-"]),
    html.span({
      key: 'value',
      style: counterStyle.value,
    }, [String(model.value)]),
    html.button({
      key: 'increment',
      onClick: address.pass(Increment)
    }, ["+"])
  ]);
};
```

Function `view` takes an instance of a counter `Model` and return desired HTML description. At no point do we mutate the DOM manually, which leaves the framework all the freedom to make all kinds of optimizations to make rendering fast. The best thing is that `view` is a plain old function so we can get the full power of module system, test frameworks, and libraries when creating views.

One tricky thing about our view function is an `address`. In nutshell address provides a view a means to communicate effects (like user events) with a rest of the program. In this specific case click on decrement button will pass `Decrement` action while click on increment button will pass `Increment` action to an address.

This pattern is the essence of this architecture. Every example from now on will be a slight variation on this basic pattern: `Model`, `update`, `view`.

### Aside: Driving your application

Most programs will have a small bit of code that drives the whole application, in the above example it will look like this:

```js
main(document.body, Model({value: 0}), update, view);
```

We are using the `main` function to wire together our initial `Model` with an `update` and `view` functions. It just performs tiny bit of boilerplate to set our program with an address to loop back changes.

The key to wiring up your application is the concept of an `Address`. Every event handler in our `view` function reports to a particular `address`. It just sends chunks of data along. The `main` function monitors all the messages coming in to this address and feeds them into the `update` function. The model gets updated and then `main` takes care of passing updated model to the `view` and rendering produced HTML onto rendering target (in our case `document.body`). This essentially creates a loop where user events cause state updates & get rendered onto screen.

We could also manually wire things up as follows:

```js
const start = (target, state, update, view) => {
  const render = state => {
    html = view(state, address);
    React.render(html, target);
  }

  const address = new Address({
    receive(action) {
      state = update(state, action);
      render(state);
    }
  });

  render(state);
};
```

## Example: Pair of counters

In example 1 we created a basic counter, but how does that pattern scale when we want two counters? Can we keep things modular? You can also see this [example in action][counter pair example]

Wouldn't it be great if we could reuse all the code from a first example? The nice thing about this architecture is that it allows you to reuse code with absolutely no changes. We just create a self-contained Counter module that encapsulates all the implementation details:

```js
import {Record, Union} from "typed-immutable";
import {html} from "reflex";

// Model

export const Model = Record({value: Number});

// Action

export const Increment = Record({label: '+'});
export const Decrement = Record({label: '-'});
export const Action = Union(Increment, Decrement);

// Update

const inc = x => x + 1
const dec = x => x - 1

export const update = (model, action) =>
  action instanceof Increment ? model.update('value', inc) :
  action instanceof Decrement ? model.update('value', dec) :
  model;

// Style

const conterStyle = {
  value: {
    fontWeight: 'bold'
  }
};

// View

export const view = (model, address) => {
  console.log('view Counter');
  return html.span({key: 'counter'}, [
    html.button({
      key: 'decrement',
      onClick: address.pass(Decrement)
    }, ["-"]),
    html.span({
      key: 'value',
      style: conterStyle.value,
    }, [String(model.value)]),
    html.button({
      key: 'increment',
      onClick: address.pass(Increment)
    }, ["+"])
  ]);
};
```

Creating modular code is all about creating strong abstractions. We want boundaries which appropriately expose functionality and hide implementation. From outside of the `Counter` module, we just see a basic set of exports: `Model`, `update`, and `view`. We do not care at all how these things are implemented. In fact, it is impossible to know how these things are implemented. This means no one can rely on implementation details that were not made public.

So now that we have our basic `Counter` module, we need to use it to create our `counter-pair`. As always, we start with a **Model**:

```js
import * as Counter from './counter';
import {Record, Union} from 'typed-immutable';
import {html, render} from 'reflex';

// Model

export const Model = Record({
  top: Counter.Model,
  bottom: Counter.Model
});
```

Our `Model` is a record with two fields, each for a counter we would like to show on screen. This fully describes all of the application state.

Next we describe the set of actions we would like to support. This time our features should be: reset all counters, update the top counter, or update the bottom counter.

```js
// Actions

export const Reset = Record({label: 'reset'});
export const ModifyTop = Record({
  label: 'modify top',
  action: Counter.Action
});
export const ModifyBottom = Record({
  label: 'modify bottom',
  action: Counter.Action
});

export const Action = Union(Reset, ModifyTop, ModifyBottom);
```

Notice that our actions refers to the `Counter.Action` type even though we do not know the particulars of those actions. When we create our `update` function, we are mainly routing these `Counter.Action` instances to the right place:

```js
// Update

const reset = model => model.merge({
  top: model.top.set('value', 0),
  bottom: model.bottom.set('value', 0)
});

export const update = (model, action) =>
  action instanceof Reset ?
    reset(model) :
  action instanceof ModifyTop ?
    model.set('top', Counter.update(model.top, action.action)) :
  action instanceof ModifyBottom ?
    model.set('bottom', Counter.update(model.bottom, action)) :
  model;
```

So now the final thing to do is create a view function that shows both of our counters on screen along with a reset button:

```js
// View

const fromTop = action => ModifyTop({action});
const fromBottom = action => ModifyBottom({action});

export const view = (model, address) => html.div({key: 'counter-pair'}, [
  html.div({key: 'top'}, [
    Counter.view(model.top, address.forward(fromTop))
  ]),
  html.div({key: 'bottom'}, [
    Counter.view(model.bottom, address.forward(fromBottom))
  ]),
  html.div({key: 'controls'}, [
    html.button({
      key: 'remove',
      onClick: address.pass(Reset)
    }, ["Reset"])
  ])
]);
```

Notice that we are able to reuse the `Counter.view` function for both of our counters. For each counter we create a forwarding address. Essentially what we are doing here is saying, "these counters will tag all outgoing messages with `ModifyTop` or `Bottom` so we can tell the difference".

That is the whole thing. The cool thing is that we can keep nesting more and more. We can take the `counter-pair` module, expose the key values and functions, and create a `counter-pair-pair` or whatever it is we need.

## Aside: Performance optimizations

Now if you try out [A Pair of Counters example][counter pair example with console] with console enabled you may notice that incrementing either of the counters triggers `Counter.view` on both counters. In a lot of cases it would make more sense to optimize code such that `view` function is invoked only for the parts of the application that actually got updated. Making such an optimization requires trivial change to the `view` function:

```js
export const view = (model, address) => html.span({
  key: 'optimized-counter-pair'
}, [
  html.div({key: 'top'}, [
    render('top', Counter.view, model.top, address.forward(fromTop))
  ]),
  html.div({key: 'bottom'}, [
    render('bottom', Counter.view, model.bottom, address.forward(fromBottom))
  ]),
  html.div({key: 'controls'}, [
    html.button({
      key: 'remove',
      onClick: address.pass(Reset)
    }, ['Reset'])
  ])
]);
```

Instead of calling `Counter.view` with arguments `render` is invoked with a cache ID, `view` function and arguments to be passed to it. This allows `render` to lazily compute or fullly eliminate view computation cost when equal arguments are passed. cache ID (mandatory first argument) is simply a way to name specific application allowing to it cache them appropriately. In above example 'top' and 'bottom' counter both get their cache.

If you take a look at a version of [pair of counters example][optimized counter pair example] with this optimization, you'll notice that `Counter.view` is only invoked for a counter that got updated.

## Example: Dynamic list of counters

A pair of counters is cool, but what about a list of counters where we can add and remove counters as we see fit? This pattern works for that case too.

You can also see this [Dynamic list of counters example][counter list example] in action.

In this example we can reuse the `Counter` module exactly as it was defined originally.

That means we can just get started on our `counter-list` module. As always, we begin with our `Model`:

```js
import {render, html} from "reflex";
import {List, Record, Union, Any} from "typed-immutable";
import * as from "counter";


// Model

const Entry = Record({
  id: String,
  counter: Counter.Model
});

export const Model = Record({
  entries: List(Entry),
  nextID: Number(0)
});
```

Now our model has a list of entries, where each is just a counter with a unique ID. These IDs allow us to distinguish between them, so if we need to update counter number `4` we have a nice way to refer to it. (This ID also gives us something convenient to `key` on when we are thinking about optimizing rendering, but that is not the focus of this section!) Our model also contains a `nextID` which helps us assign unique IDs to each counter as we add new ones.

Now we can define the set of actions that can be performed on our model. We want to be able to `Add` counters, `Remove` counters, and `Modify` certain counters.

```js
// Actions

export const Add = Record({
  label: 'Add counter'
});

export const Remove = Record({
  label: 'Remove counter',
});

export const Modify = Record({
  label: 'Modify counter',
  id: String,
  action: Counter.Action
});

export const Action = Union(Add, Remove, Modify);
```

Our action types are shockingly close to the high-level description. Now we can define our `update` function.

```js
// Update

const add = model => {
  const entry = Entry({
    id: String(model.nextID),
    counter: Counter.Model({value: 0})
  });

  return model.merge({
    nextID: model.nextID + 1,
    entries: model.entries.push(entry)
  });
};

const remove = model =>
  model.set('entries', model.entries.skip(1));

const modify = (model, id, action) => {
  const updateEntry = entry =>
    entry.id !== id ? entry :
    entry.set('counter', Counter.update(entry.counter, action));

  return model.set('entries', model.entries.map(updateEntry));
}

export const update = (model, action) =>
  action instanceof Add ? add(model) :
  action instanceof Remove ? remove(model) :
  action instanceof Modify ? modify(model, action.id, action.action) :
  model;
```

Here is a high-level description of each case:

`Add` — First we create a new counter and put it at the end of our counter list. Then we increment our nextID so that we have a fresh ID next time around.

`Remove` — Drop the first entry of our counter list.

`Modify` — Run through all of our counter entries. If we find one with a matching `id`, perform an `action` on that counter.

All that is left to do now is to define the `view`.

```js
// View
const from = id => action => Modify({id, action});
const viewEntry = (entry, address) =>
  html.div({key: entry.id}, [
    Counter.view(entry.counter, address.forward(from(entry.id)))
  ]);

export const view = (model, address) => html.div({key: 'CounterList'}, [
  html.div({
    key: 'controls'
  }, [
    html.button({
      key: "remove",
      onClick: address.pass(Remove)
    }, ["Remove"]),
    html.button({
      key: "add",
      onClick: address.pass(Add)
    }, ["Add"])
  ]),
  html.div({
    key: "entries"
  }, model.entries.map(entry => render(entry.id, viewEntry, entry, address)))
]);
```

The fun fact is we end up using same old `Counter.view` function we just use `address.forward` to annotate actions with an `id` to associate each with a specific counter entry rendered.

This `id` trick can be used any time you want a dynamic number of subcomponents. Counters are very simple, but the pattern would work exactly the same if you had a list of user profiles or tweets or newsfeed items or product details.

## Example: List of removable counters

Okay, keeping things simple and modular on a dynamic list of counters is pretty cool, but instead of a general remove button, what if we need to allow removal of a specific counter ? To accommodate such a requirement we need to add a remove button next to each counter. It may seem that would mess things up and require fundamental changes, but quite the opposite, as we will see from this example it will require very little changes to `coutner-list` module, to add a different way to **view** and **update** existing **model**.

You can also see [List of removable counters example][removable counter list example] in action.

On of the goals of this example is to illustrate how new requirement can easily be met with a minimal changes or no changes to the existing code base.

To accommodate new requirements we will need to define a new action for removing a specific counter rather than just most top one and an `update` function that handles such action:

```js
// Action
export const RemoveByID = Record({
  label: 'Remove by ID',
  id: String
});
export const Action = Union(RemoveByID, CounterList.Action);

// Update

const removeByID = (model, id) =>
  model.set('entries', model.entries.filter(entry => entry.id !== id));

export const update = (model, action) =>
  action instanceof RemoveByID ? removeByID(model, action.id) :
  CounterList.update(model, action);
```

We also need a slightly different (from `CounterList.view`) way to `view` counters in order to display individual remove button next to each counter.

```js
// View
const from = id => action => CounterList.Modify({id, action});
const RemoveFor = id => _ => RemoveByID({id});

const viewEntry = (entry, address) =>
  html.div({key: entry.id}, [
    Counter.view(counter, address.forward(from(entry.id))),
    html.button({
      key: 'remove',
      onClick: address.pass(RemoveFor(entry.id))
    }, 'x')
  ]);

export const view = (model, address) => html.div({
  key: 'RemovableCounterList'
}, [
  html.div({
    key: 'controls',
  }, [
    html.button({
      key: "add",
      onClick: address.pass(CounterList.Add)
    }, ["Add"]),
  ]),
  html.div({
    key: "entries"
  }, model.entries.map(entry => render(entry.id, viewEntry, entry, address)))
]);
```

 Please notice that we did not need to modify or duplicate any code neither we need jump to complicate stuff by subclassing or overloading or mixing to accommodate changed requirements. We were able to reuse **model** as defined
 previously as it perfectly captures a state structure. We just needed a new **action** to represent new interaction and a new way to **view** counter entries to display new remove button per entry.

 We could address new requirements either by making small changes to existing `CounterList` module or by defining a new `RemovableCounterList` module that reuses most of the `CounterList` functions. You may have noticed that `view` functions in both cases are very similar, in fact it would not be too difficult to refactor common parts into high order function, but in this case this would have helped illustration of the inteded point.


## Big Lessons So Far

**Basic pattern** — Everything is built around a **Model**, a way to **update** that model and a way to **view** that model. Everything else is just a variation of this basic pattern.

**Nesting pattern** - Forwarding addresses make provide a simple way to nest a basic pattern that hides implementation details entirely. We can nest this pattern arbitrarily deep, and each level only needs to know about what is going on one level lower.

**Performance optimizations** - A **render** function allows us to optimize a **view** via lazy computation and smart caching. With that re-viewing unchanged **model** is nearly free. Also please use `render` with care as in some cases it maybe cheaper to recompute view than assert if stat has changed. For example `render` will have a negative impact on views of the state that always changes.

**Testing is Easy** — All of the functions we have created are [pure functions][pure functions]. That makes it extremely easy to test your `update` and `view` functions. There is no special initialization or mocking or configuration step, you just call the function with the arguments you would like to test.

**Flux is by product** - At no point we talked about the flux, dispatcher or stores. In fact our applications are wired with a single address and maybe some extra ones that forward to it that is essentially your dispatcher. Since the whole application state it is modeled via Model which is your store as of business logic it's exactly what `update` function is about.

[single counter example]:https://jsbin.com/cuseri/edit?js,output
[counter pair example]:https://jsbin.com/bogoyaj/edit?js,output
[counter pair example with console]:https://jsbin.com/bogoyaj/edit?js,console,output
[optimized counter pair example]:https://jsbin.com/movonu/edit?js,console,output
[counter list example]:https://jsbin.com/yiqiya/edit?js,output
[removable counter list example]:https://jsbin.com/hicuni/edit?js,output
[pure functions]:http://en.wikipedia.org/wiki/Pure_function
[browser.html]:https://github.com/mozilla/browser.html
[react]:http://facebook.github.io/react/
