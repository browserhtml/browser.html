/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  'use strict';

  const Focusable = require('../common/focusable');
  const {Element, BeforeAppendAttribute, VirtualAttribute,
        BubbledEvent, VirtualEvent} = require('../common/element');
  const React = require('../common/react');
  const {html} = require('reflex');

  const DOMProperty = require('react/lib/ReactInjection').DOMProperty;

  // This call will throw on livereload as react is already has these properties
  // injected there for we wrap it try / catch.
  try {
    // Configure react to make it understand custom mozbrowser attributes.
    DOMProperty.injectDOMPropertyConfig({
      Properties: {
        'remote': DOMProperty.MUST_USE_ATTRIBUTE,
        'mozbrowser': DOMProperty.MUST_USE_ATTRIBUTE,
        'mozapp': DOMProperty.MUST_USE_ATTRIBUTE,
        'mozallowfullscreen': DOMProperty.MUST_USE_ATTRIBUTE,
      }
    });
  } catch (_) {}

  const transplant = (from, to) => {
    for (let {name, value} of from.attributes) {
      to.setAttribute(name, value);
    }

    for (let name of from.properties.names) {
      to[name] = node[name];
    }

    return to;
  }

  const view = Element('iframe', {
    opener: new VirtualAttribute((node, current) => {
      const element = current instanceof String && current.unbox != null ?
                        current.unbox() :
                        null;


      if (element != null && node !== element) {
        return transplant(node, element);
      } else {
        return node;
      }
    }),
    isFocused: Focusable.Field.isFocused,
    isVisible: new VirtualAttribute((node, current, past) => {
      if (current != past) {
        if (node.setVisible) {
          try {
            node.setVisible(current);
          } catch (error) {
            if (!node.isSetVisibleBroken) {
              console.error(error);
            }
          }
        }
      }
      return node;
    }),
    zoom: new VirtualAttribute((node, current, past) => {
      if (current != past) {
        if (node.zoom) {
          try {
            node.zoom(current);
          } catch (error) {
            if (!node.isZoomBroken) {
              console.error(error);
            }
          }
        }
      }
      return node;
    }),
    task: new VirtualAttribute((node, current, past) => {
      if (current != past) {
        if (current && current.run) {
          current.run(node);
        }
      }

      return node;
    }),
    onAsyncScroll: new BubbledEvent('mozbrowserasyncscroll'),
    onClose: new BubbledEvent('mozbrowserclose'),
    onOpenWindow: new BubbledEvent('mozbrowseropenwindow'),
    onOpenTab: new BubbledEvent('mozbrowseropentab'),
    onMenu: new BubbledEvent('mozbrowsercontextmenu'),
    onError: new BubbledEvent('mozbrowsererror'),
    onLoadStarted: new BubbledEvent('mozbrowserloadstart'),
    onLoadEnded: new BubbledEvent('mozbrowserloadend'),
    onIconChanged: new BubbledEvent('mozbrowsericonchange'),
    onUserActivityDone: new BubbledEvent('mozbrowseractivitydone'),
    onVisibilityChanged: new BubbledEvent('mozbrowservisibilitychange'),
    onMetaChanged: new BubbledEvent('mozbrowsermetachange'),
    onFirstPaint: new BubbledEvent('mozbrowserfirstpaint'),
    onDocumentFirstPaint: new BubbledEvent('mozbrowserdocumentfirstpaint'),
    // Use `VirtualEvent` to proxy events in order to mutate `target.location`
    // so that user can check `target.location` before deciding if change to
    // `target.src` is required.
    onLocationChanged: new BubbledEvent('mozbrowserlocationchange'),
    onSecurityChanged: new BubbledEvent('mozbrowsersecuritychange'),
    onTitleChanged: new BubbledEvent('mozbrowsertitlechange'),
    onPrompt: new BubbledEvent('mozbrowsershowmodalprompt'),
    onAuthentificate: new BubbledEvent('mozbrowserusernameandpasswordrequired'),
    onScrollAreaChange: new BubbledEvent('mozbrowserscrollareachanged'),
    onLoadProgressChange: new BubbledEvent('mozbrowserloadprogresschanged'),

    // It is unfortunate that state of `canGoBack` and `canGoForward` is
    // not observadle, with virtual events we polifill more desired API
    // and pretend there are events dispatched when state changes.
    onCanGoBackChanged: new VirtualEvent((target, dispatch) => {
      const onsuccess = request =>
        dispatch({target,
                  type: 'mozbrowsergobackchanged',
                  detail: request.target.result});

      target.addEventListener('mozbrowserlocationchange', event => {
        target.getCanGoBack().onsuccess = onsuccess;
      });

      return target;
    }),
    onCanGoForwardChanged: new VirtualEvent((target, dispatch) => {
      const onsuccess = request =>
        dispatch({target,
                  type: 'mozbrowsergoforwardchanged',
                  detail: request.target.result});

      target.addEventListener('mozbrowserlocationchange', event => {
        target.getCanGoForward().onsuccess = onsuccess;
      });

      return target;
    })
  });
  exports.view = view;

  // Gecko API for handling `window.open` has very unfortunate design
  // (see #566, #565, #564). To workaround it and present more desirable
  // API that also works with react we employ a hack to generate `opener`
  // `String` instance (not a primitive value) that holds a reference to
  // an iframe. It is used to box / unbox actual iframe that is then used
  // by an IFrame to replace nodes.
  const Opener = iframe => {
    if (iframe) {
      // See: https://github.com/mozilla/browser.html/issues/568
      iframe.isSetVisibleBroken = true;
      // See: https://github.com/mozilla/browser.html/issues/567
      iframe.isZoomBroken = true;
    }
    const opener = new String(++Opener.lastID);
    opener.unbox = () => iframe;
    return opener;
  }
  Opener.lastID = 0;
  exports.Opener = Opener;
