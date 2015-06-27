# Architecture overview

This document outlines the general architecture you will see used in [browser.html][browser.html] implementation. Foundation of this architecture has being encoded in a [reflex][reflex] library that is a thin wrapper over [react][] enforcing described architecture.

This document will illustrate a very simple architecture pattern that serves as an infinitely nestable building block. It is great for modularity, code reuse, and testing. Ultimately, this pattern makes it easy to solve complex problems in a way that stays modular. For the illustration purposes we will start with the basic pattern in a small example and build on those core principles.

## The Basic Pattern

The logic of every program will break up into three cleanly separated parts: **model**, **actions**, **update** and **view**. You can pretty reliably start with the following skeleton and then iteratively fill in details for your particular case.

```js
// Model

const Model = Record({ /*...*/ });

// Actions

const Reset = Record({id: Number});

// Update

Model.update = (model, action) =>
  // If `Reset` action reset the model.
  action.constructor === Reset ? model.clear() :
  // If unknown action just keep things as is.
  model;

// View

Model.view = model => html.div({ /*...*/ });
```

## Example: Counter

First example is a simple counter that can be incremented or decremented. You can also see this [example in action][single counter example].

This code starts with a very simple model. We just need to keep track of a number `value` of the counter. It is also a good ideal to have an id associated with any model:

```js
let Counter = Record({
  id: String('counter'),
  value: Number(0)
});
```

When it comes to updating a model, things are relatively simple again. We define a set of actions that may be performed and an update function to actually perform those actions:

```js
const Increment = Record({id: String});
const Decrement = Record({id: String});
Counter.Action = Union(Increment, Decrement);

Counter.update = (model, action) =>
  action.constructor === Increment ? model.update('value', x => x + 1) :
  action.constructor === Decrement ? model.update('value', x => x - 1) :
  model;
```

Notice that our action types do not do anything, they simply describe actions that are possible. This is important as this leaves decision on how to react to those actions up to a user of a counter module. For example user may choose to have max `value` that counter can take and ignore `Incerement` actions if that max value is reached.

This also allows users to add more actions, for example they may decides that counter should be doubled when a certain button is pressed, that will be a new action type. This means our code ends up being very clear about how our model can be transformed. Anyone reading this code will immediately know what is allowed and what is not. Furthermore, they will know exactly how to add new features in a consistent way.

Finally, we create a way to `view` our `Counter`. In this example we create a `div` that contains: a decrement `button`, a `span` showing the current count, and an increment `button`.

```js
const countStyle = {fontWeight: 'bold'/*, ... */};

Counter.view = model => {
  return html.div({key: model.id}, [
    html.button({
      key: 'decrement',
      onClick: _ => Decrement({id: model.id})
    }, ["-"]),
    html.span({
      key: 'value',
      style: countStyle,
    }, [String(model.value)]),
    html.button({
      key: 'increment',
      onClick: _ => Increment({id: model.id})
    }, ["+"])
  ]);
};
```

Everything about our `view` function should be straight forward, on decrement button click `Decrement` action is produced and on increment button click `Increment` action is produced. It is worth a notice that this code is entirely declarative. It take a `model` (`Counter` instance) and produce some html. That is it. At no point do we mutate the DOM manually, which gives the library much more freedom to make clever optimizations and actually make rendering faster overall. It is crazy. Furthermore, `view` is a plain old function so we can get the full power of module system, test frameworks, and libraries when creating views.

This pattern is the essence of this architecture. Every example from now on will be a slight variation on this basic pattern: `Model`, `update`, `view`.

### Aside: Driving your application

So far we have only been talking about pure functions and immutable data. This is great, but we also need to start an application (counter in our case), make it react to user interactions and evolve our model somehow.

Pretty much all programs will have a little bit of code that drives the whole application. In the current example it will look like this:

```js
main(document.body, Counter());
```

Let briefly draw attention to what is going on behind the scenes:

- Application is started with given state, in this case `Counter()`, which is equivalent of `Counter({id:0, value:0})` given a model definition. In other words initial value of counter will be `0`.
- Application will use default `update` function - `Counter.update` to react to
user actions to step an application to a next state by evolving a current state.
*Note: Optionally `main` could be passed a different `update` function as a third argument*.
- Application puts it all on screen by rendering html for every single state by   calling a `view` function. In this case default for the model - `Counter.view` is used although optionally `main` could be passed a different `view` function as a forth argument.


## Example: Pair of counters

In example 1 we created a basic counter, but how does that pattern scale when we want two counters? Can we keep things modular? You can also see this [example in action][counter pair example]

Wouldn't it be great if we could reuse all the code from a first example? The crazy thing about this architecture is that it allows you to reuse code with absolutely no changes. We just create a self-contained Counter module that encapsulates all the implementation details:

```js
import {Record, Union} from "typed-immutable";
import {html} from "reflex";

// Model

let Counter = Record({
  id: String('counter'),
  value: Number(0)
});

// Action

let Increment = Record({id: String});
let Decrement = Record({id: String});
Counter.Action = Union(Increment, Decrement);

// Update

let inc = x => x + 1
let dec = x => x - 1

Counter.update = (model, action) =>
  action.constructor === Increment ? model.update('value', inc) :
  action.constructor === Decrement ? model.update('value', dec) :
  model;

// View

const countStyle = {fontWeight: 'bold'/*, ... */};

Counter.view = model => {
  console.log(`<counter id=${model.id} value=${model.value}`)
  return html.div({key: model.id}, [
    html.button({
      key: 'decrement',
      onClick: _ => Decrement({id: model.id})
    }, ["-"]),
    html.span({
      key: 'value',
      style: countStyle,
    }, [String(model.value)]),
    html.button({
      key: 'increment',
      onClick: _ => Increment({id: model.id})
    }, ["+"])
  ]);
};

export var Model = Counter;
export var Action = Counter.Action;
export var update = Counter.update;
export var view = Counter.view;
```

Creating modular code is all about creating strong abstractions. We want boundaries which appropriately expose functionality and hide implementation. From outside of the `counter` module, we just see a basic set of values: `Model`, `update`, and `view`. We do not care at all how these things are implemented. In fact, it is impossible to know how these things are implemented. This means no one can rely on implementation details that were not made public.

So now that we have our basic `Counter` module, we need to use it to create our `counter-pair`. As always, we start with a **model**:

```js
import {Model as Counter} from 'counter';
import {Record, Union} from 'typed-immutable';
import {reframe, html} from 'reflex';

// Model

let CounterPair = Record({
  id: String('counter-pair'),
  top: Counter({id: 'top'}),
  bottom: Counter({id: 'bottom'})
});
```

Our `CounterPair` is a record with three fields, id and a feild for each of the counters we would like to show on screen. This fully describes all of the application state.

Next we describe the set of actions we would like to support. This time our features should be: reset all counters, update the top counter, or update the bottom counter.

```js
// Actions

const Reset = Record({id: String});
const Top = Record({action: Counter.Action});
const Bottom = Record({action: Counter.Action});

CounterPair.Action = Union(Reset, Top, Bottom);
```

Notice that our actions refers to the `Counter.Action` type even though we do not know the particulars of those actions. When we create our `update` function, we are mainly routing these `Counter.Action` instances to the right place:

```js
// Update

CounterPair.update = (model, {constructor, action}) =>
  constructor === Reset ? CounterPair() :
  constructor === Top ? model.set('top', Counter.update(model.top, action)) :
  constructor === Bottom ? model.set('bottom', Counter.update(model.bottom, action)) :
  model;
```

So now the final thing to do is create a view function that shows both of our counters on screen along with a reset button:

```js
// View

CounterPair.view = model => html.div({
  key: model.id
}, [
  reframe(action => Top({action}), Counter.view(model.top)),
  reframe(action => Bottom({action}), Counter.view(model.bottom)),
  html.button({
    key: 'remove',
    onClick: event => Reset(model)
  }, ["Reset"])
]);
```

Notice that we are able to reuse the `Counter.view` function for both of our counters. Although we `reframe` each counter we create to forward their actions. Essentially what we are doing here is saying, "these counters will tag all outgoing actions with `Top` or `Bottom` so we can tell the difference".

That is the whole thing. The cool thing is that we can keep nesting more and more. We can take the `counter-pair` module, expose the key values and functions, and create a `counter-pair-pair` or whatever it is we need.

## Aside: Performance optimizations

Now if you try out [A Pair of Counters example][counter pair example with console] with console enabled you may notice that incrementing either of the counters triggers `Counter.view` on both counters. In a lot of cases it would make more sense to optimize code such that `view` will be invoked only for the parts of the application who's model has being updated. Making such optimization is in fact trivial and requires only a subtle update do a `view` function:

```js
CounterPair.view = model => html.div({
  key: model.id
}, [
  reframe(action => Top({action}), render(model.top)),
  reframe(action => Bottom({action}), render(model.bottom)),
  html.button({
    key: 'remove',
    onClick: event => Reset(model)
  }, ['Reset'])
]);
```

Only thing that has changed is the way `view` function is invoked on a model from `Counter.view(model)` it has changed to `render(model)`. `render` function in fact does call `Counter.view(model)` under the hood but it also intelligently caches returned value so that if next time it's invoked with an equal `model` it
will just return cached value back.

If you take a look at a version of [pair of counters example][optimized counter pair example] with this optimization, you'll notice that `Counter.view` is only invoked for a counter model that has being updated.

In some cases you may need to `view` a model with a different view function which also can be done using `render` by passing it a cunstor view function as a second argument.


## Example: Dynamic list of counters

A pair of counters is cool, but what about a list of counters where we can add and remove counters as we see fit? This pattern works for that case too.

You can also see this [Dynamic list of counters example][counter list example] in action.

In this example we can reuse the `Counter` module exactly as it was defined originally.

That means we can just get started on our `counter-list` module. As always, we begin with our `Model`:

```js
import {render, html, reframe} from "reflex";
import {List, Record, Union, Any} from "typed-immutable";
import {Model as Counter} from "counter";


// Model

let CounterList = Record({
  id: String('counter-list'),
  counters: List(Counter),
  nextID: Number(0)
});
```

Now our model has a list of counters, each annotated with a unique ID. These IDs allow us to distinguish between them, so if we need to update counter number `4` we have a nice way to refer to it. (This ID also gives us something convenient to `key` on when we are thinking about optimizing rendering, but that is not the focus of this tutorial!) Our model also contains a `nextID` which helps us assign unique IDs to each counter as we add new ones.

Now we can define the set of actions that can be performed on our model. We want to be able to `Add` counters, `Remove` counters, and `Modify` certain counters.

```js
// Actions

let Add = Record({id: String});
let Remove = Record({id: String});
let Modify = Record({id: String, action: Counter.Action});

CounterList.Action = Union(Add, Remove, Modify);
```

Our action types are shockingly close to the high-level description. Now we can define our `update` function.

```js
let add = model => model.merge({
  nextID: model.nextID + 1,
  counters: model.counters
                 .push(Counter({
                   id: String(model.nextID)
                 }))
});

let remove = model => model.merge({
  counters: model.counters.skip(1)
});

var modify = (model, id, action) => model.merge({
  counters: model.counters
                 .map(counter => counter.id !== id ? counter :
                                 Counter.update(counter, action))
});

CounterList.update = (model, {constructor, id, action}) =>
  constructor === Add ? add(model) :
  constructor === Remove ? remove(model) :
  constructor === Modify ? modify(model, id, action) :
  model;
```

Here is a high-level description of each case:

`Add` — First we create a new counter and put it at the end of our counter list. Then we increment our nextID so that we have a fresh ID next time around.

`Remove` — Drop the first member of our counter list.

`Modify` — Run through all of our counters. If we find one with a matching `id`, we perform the given `action` on that counter.

All that is left to do now is to define the `view`.

```js
// View
let viewCounter = model =>
  reframe(action => Modify({id: model.id, action}),
          render(model));

CounterList.view = model => {
  return html.div({key: model.id}, [
    html.button({
      key: "remove",
      onClick: event => Remove(model)
    }, ["Remove"]),
    html.button({
      key: "add",
      onClick: event => Add(model)
    }, ["Add"]),
    html.div({
      key: "counters"
    }, model.counters.map(viewCounter))
  ]);
};
```

The fun part here is the `viewCounter` function. It uses the same old `Counter.view` function althught through `render`, but in this case result of it is reframed in order to annotates all actions with the `id` of the particular counter that is rendered.

When we create the actual `view` function, we map `viewCounter` over all of our counters and create `add` and `remove` buttons that produce `Add` and `Remove` actions.

This `id` trick can be used any time you want a dynamic number of subcomponents. Counters are very simple, but the pattern would work exactly the same if you had a list of user profiles or tweets or newsfeed items or product details.


## Example: List of removable counters

Okay, keeping things simple and modular on a dynamic list of counters is pretty cool, but instead of a general remove button, what if each counter had its own specific remove button? It may seem that would mess things up and require fundamental changes, but quite the opposite, as we will see from this example it will require no changes an existing `counters` module & very little additions to `coutner-list` module, to add a different way to **view** and **update** existing **model**.

You can also see [List of removable counters example][removable counter list example] in action.

On of the goals of this example is to illustrate how new requirement can easily be met with a minimal changes to the code base.

To meet adjusted requirements we will need a new way to `view` a `Counter` model, more specifically it needs to have an additional remove button. We would also need a new way to `view` `CursorList` as previously defined obsolete remove button is no longer needed. Also we would need a new way to `.update` a `CounterList` model to allow removal of any `Cursor` not just the most top one. What is important to notice that we do not need to modify or duplicate any code neither we need jump to complicate stuff by subclassing or overloading or mixing.

There is no need for a new **model** as previously defined one perfectly captures a state structure. We need a new **action** which remove button of each counter will be able to trigger & a new `update` function that knows how to handle it.


```js
// Model

CounterList.Removable = data => CounterList(data);

// Actions
let RemoveByID = Record({id: String});
CounterList.Removable.Action = Union(Add, RemoveByID, Modify);


// Update
let removeByID = (model, id) => model.merge({
  counters: model.counters.filter(counter => counter.id !== id)
});

CounterList.Removable.remove = (model, action) =>
  action.constructor === RemoveByID ? removeByID(model, action.id) :
  CounterList.update(model, action);
```

Now that we have defined new **action** and a way to `update` the model when it occurs all is left to define new way of viewing model so each counter will also have a associated remove button.

```js
// View

let viewRemovableCounter = model =>
  html.div({key: model.id}, [
    viewCounter(model),
    html.button({
      key: "remove",
      onClick: event => RemoveByID(model)
    }, ["x"])
  ]);

CounterList.Removable.view = model =>
  html.div({key: model.id}, [
    html.button({
      key: "add",
      onClick: event => Add(model)
    }, ["Add"]),
    html.div({
      key: "counters"
    }, model.counters.map(model => render(model, viewRemovableCounter)))
  ]);
```

Let's go through the new functions, `viewRemovableCounter` just wraps already previously defined `viewCounter` function to add a remove button for a counter that triggers `RemoveByID` action. As of `Removable.view` it's pretty much similar to `CounterList.view` just uses `viewRemovableCounter` to render each counter and no longer creates legacy remove button.

## Aside: No perfect container

As you may have noticed with from our removable counter list example we end up with a remove buttons on different row from increment / decrement buttons which may or may not be desired. The issue is that in a very first `Counter` example we made a guess that `div` would be a wrapper node for rest of the controls, while that made sense originally it did not really fit updated requirements. Good news is there is a `fragment` function that allows you to create view without a container:

```js
Counter.view = model => {
  return fragment({key: model.id}, [
    html.button({
      key: 'decrement',
      onClick: _ => Decrement({id: model.id})
    }, ["-"]),
    html.span({
      key: 'value',
      style: countStyle,
    }, [String(model.value)]),
    html.button({
      key: 'increment',
      onClick: _ => Increment({id: model.id})
    }, ["+"])
  ]);
};
```

Only change we need to make in order to avoid remove button on the next line is
change our original `Counter.view` function and replace our `html.div` container with `fragment`, that is it! You can see an example of

## Big Lessons So Far

**Basic pattern** — Everything is built around a **model**, **actions** that may occur & cause changes, a way to **update** the model in response to **actions** and a way to **view** a model. Everything is just a variation of this basic pattern.

**Nesting pattern** - Reframing a **view** provides a simple way to nest a basic pattern that hides implementation details entirely. Reframing allows nesting of  arbitrary and on every level only thing you need to know is what is going one level deeper.

**Performance optimizations** - A **render** function allows to optimize a way to **view** a **model** by caching, so that viewing equal **model** several times in a row would hit a cache and actually avoid calling `view` function. Also please use `render` with care as sometimes it may lead to worth performance than plain `view` it could be that asserting equality of models is more costly than a call to `view` specially if it model viewed is known to always be unequal.

**Testing is Easy** — All of the functions we have created are [pure functions][pure functions]. That makes it extremely easy to test your `update` and `view` functions. There is no special initialization or mocking or configuration step, you just call the function with the arguments you would like to test.


[single counter example]:http://jsbin.com/cuseri/9/edit?js,output
[counter pair example]:http://jsbin.com/bogoyaj/4/edit?js,output
[counter pair example with console]:http://jsbin.com/bogoyaj/4/edit?js,console,output
[optimized counter pair example]:http://jsbin.com/bikole/3/edit?js,console,output
[counter list example]:http://jsbin.com/lisugu/4/edit?js,output
[removable counter list example]:http://jsbin.com/nuwire/3/edit?js,output
[performance optimization example]:http://jsbin.com/zozuqe/5/edit?js,console,output
[fragment container]:http://jsbin.com/soquti/2/edit?js,output
[pure functions]:http://en.wikipedia.org/wiki/Pure_function
[browser.html]:https://github.com/mozilla/browser.html
[react]:http://facebook.github.io/react/
