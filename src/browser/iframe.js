/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  'use strict';

  const Focusable = require('../common/focusable');
  const {ElementView, BeforeAppendAttribute, VirtualAttribute, Event, VirtualEvent} = require('../common/element');
  const React = require('react');
  const {html} = require('reflex');

  class IFrameView extends ElementView {
    componentDidMount() {
      super.componentDidMount();
      this.setState({swapped: true});
    }
    render() {
      return React.createElement(this.props.type, this.props.model,
                                 this.props.children);
    }
  }

  const view = IFrameView.create('iframe', {
    opener: new VirtualAttribute((node, current) => {
      const element = current instanceof String &&
                      current.unbox &&
                      current.unbox();

      if (element && node !== element) {
        for (let {name, value} of node.attributes) {
          element.setAttribute(name, value);
        }

        for (let name of node.properties.names) {
          element[name] = node.name;
        }

        node.parentNode.replaceChild(element, node);
      }
    }),
    isFocused: Focusable.Field.isFocused,
    remote: new BeforeAppendAttribute('remote'),
    mozbrowser: new BeforeAppendAttribute('mozbrowser'),
    mozapp: new BeforeAppendAttribute('mozapp'),
    mozallowfullscreen: new BeforeAppendAttribute('mozallowfullscreen'),
    uri: VirtualAttribute((node, current, past) => {
      if (current != past) {
        const uri = node.setVisible ? current : `data:text/html,${current}`
        if (node.location !== uri) {
          node.location = uri;
          node.src = uri;
        }
      }
    }),
    isVisible: VirtualAttribute((node, current, past) => {
      if (current != past) {
        if (node.setVisible) {
          try {
            node.setVisible(current);
          } catch (error) {
            if (!node.isSetVisibleBroken) {
              throw(error);
            }
          }
        }
      }
    }),
    zoom: VirtualAttribute((node, current, past) => {
      if (current != past) {
        if (node.zoom) {
          try {
            node.zoom(current);
          } catch (error) {
            if (!node.isZoomBroken) {
              throw(error);
            }
          }
        }
      }
    }),
    onAsyncScroll: Event('mozbrowserasyncscroll'),
    onClose: Event('mozbrowserclose'),
    onOpenWindow: Event('mozbrowseropenwindow'),
    onOpenTab: Event('mozbrowseropentab'),
    onMenu: Event('mozbrowsercontextmenu'),
    onError: Event('mozbrowsererror'),
    onLoadStarted: Event('mozbrowserloadstart'),
    onLoadEnded: Event('mozbrowserloadend'),
    onIconChanged: Event('mozbrowsericonchange'),
    onUserActivityDone: Event('mozbrowseractivitydone'),
    onVisibilityChanged: Event('mozbrowservisibilitychange'),
    onMetaChanged: Event('mozbrowsermetachange'),
    onFirstPaint: Event('mozbrowserfirstpaint'),
    onDocumentFirstPaint: Event('mozbrowserdocumentfirstpaint'),
    // Use `VirtualEvent` to proxy events in order to mutate `target.location`
    // so that user can check `target.location` before deciding if change to
    // `target.src` is required.
    onLocationChanged: VirtualEvent((target, dispatch) => {
      target.addEventListener('mozbrowserlocationchange', event => {
        target.location = event.detail;
        // Set an attribute as well so that in the inspector we can tell what
        // is the location of a page even if user navigated away.
        target.setAttribute('location', event.detail);
        dispatch(event);
      });
    }),
    onSecurityChanged: Event('mozbrowsersecuritychange'),
    onTitleChanged: Event('mozbrowsertitlechange'),
    onPrompt: Event('mozbrowsershowmodalprompt'),
    onAuthentificate: Event('mozbrowserusernameandpasswordrequired'),
    onScrollAreaChange: Event('mozbrowserscrollareachanged'),
    onLoadProgressChange: Event('mozbrowserloadprogresschanged'),

    // It is unfortunate that state of `canGoBack` and `canGoForward` is
    // not observadle, with virtual events we polifill more desired API
    // and pretend there are events dispatched when state changes.
    onCanGoBackChanged: VirtualEvent((target, dispatch) => {
      const onsuccess = request =>
        dispatch({target,
                  type: 'mozbrowsergobackchanged',
                  detail: request.target.result});

      target.addEventListener('mozbrowserlocationchange', event => {
        target.getCanGoBack().onsuccess = onsuccess;
      });
    }),
    onCanGoForwardChanged: VirtualEvent((target, dispatch) => {
      const onsuccess = request =>
        dispatch({target,
                  type: 'mozbrowsergoforwardchanged',
                  detail: request.target.result});

      target.addEventListener('mozbrowserlocationchange', event => {
        target.getCanGoForward().onsuccess = onsuccess;
      });
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
