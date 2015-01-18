/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * tabiframedeck.js
 *
 * This is the central piece of Firefox.html.
 * TabIframeDeck controls the list of <tab-iframe>s.
 *
 * TabIframeDeck object is used to manipulate the list
 * of tabs (add, remove, select, …) and be notified
 * on tab changes (events like 'select', 'add', …).
 *
 */

define(['js/tabiframe', 'js/eventemitter', 'js/keybindings'],
       function(TabIframe, EventEmitter, RegisterKeyBindings) {

  'use strict';

  const HOMEPAGE = 'https://github.com/mozilla/browser.html/commits/master';

  let _tabIframeArray = [];
  let _selectIndex = -1;

  const TabIframeDeck = {

    // This is a poor man session storage. Just a temporary
    // thing (localStorage is bad).
    saveSession: function() {
      let session = _tabIframeArray.map(t => t.location);
      window.localStorage.session = JSON.stringify(session);
    },

    restoreSession: function() {
      let session = [];
      try {
        session = JSON.parse(window.localStorage.session);
      } catch (e) {}

      if (Array.isArray(session) && session.length > 0) {
        for (let url of session) {
          TabIframeDeck.add({url});
        }
      } else {
        TabIframeDeck.add({url: HOMEPAGE});
      }
    },

    onMozBrowserOpenWindow: function(type, event) {
      TabIframeDeck.add({url: event.detail.url});
    },

    add: function(options={}) {
      let tabIframe = document.createElement('tab-iframe');
      tabIframe.setAttribute('flex', '1');

      // Set tabPosition if not defined already
      let tabPosition = this.getCount();
      if (options.tabPosition) {
        tabPosition = options.tabPosition;
      }

      //Inserting at specified position instead of always at the end
      let parent = document.querySelector('.iframes');
      parent.insertBefore(tabIframe, parent.children[tabPosition]);
      _tabIframeArray.splice(tabPosition, 0, tabIframe);

      tabIframe.on('mozbrowseropenwindow', this.onMozBrowserOpenWindow);
      tabIframe.on('mozbrowserlocationchange', this.saveSession);

      this.emit('add', {tabIframe: tabIframe, tabPosition: tabPosition});

      if (options.url) {
        tabIframe.setLocation(options.url);
      }

      if (options.select || _selectIndex < 0) {
        this.select(tabIframe);
      } else {
        tabIframe.hide();
      }

      this.saveSession();

      return tabIframe;
    },

    remove: function(tabIframe) {
      let index = _tabIframeArray.indexOf(tabIframe);
      if (index < 0) {
        throw new Error('Unknown tabIframe');
      }

      if (_tabIframeArray.length == 1) {
        throw new Error('Deck has only one tabiframe');
      }

      if (index == _selectIndex) {
        let newSelectIndex;
        if (index == _tabIframeArray.length - 1) {
          newSelectIndex = index - 1;
        } else {
          newSelectIndex = index + 1;
        }
        this.select(_tabIframeArray[newSelectIndex]);
      }

      if (_selectIndex > index) {
        _selectIndex--;
      }

      _tabIframeArray.splice(index, 1);
      tabIframe.off('mozbrowseropenwindow', this.onMozBrowserOpenWindow);
      tabIframe.remove();

      this.saveSession();

      this.emit('remove', {tabIframe});
    },

    select: function(tabIframe) {
      let index = _tabIframeArray.indexOf(tabIframe);
      if (index < 0) {
        throw new Error('Unknown tabiframe');
      }

      if (index == _selectIndex) {
        // already selected
        return;
      }

      tabIframe.willBeVisibleSoon();

      let previouslySelectTabIframe = _tabIframeArray[_selectIndex];
      if (previouslySelectTabIframe) {
        this.emit('unselect', {tabIframe: previouslySelectTabIframe});
      }

      _selectIndex = index;

      this.emit('select', {tabIframe});

      // Do the actual switch
      window.mozRequestAnimationFrame(() => {
        if (previouslySelectTabIframe) {
          previouslySelectTabIframe.hide();
        }
        tabIframe.show();
      });
    },

    selectNext: function() {
      let newSelectIndex = _selectIndex + 1;
      if (newSelectIndex == _tabIframeArray.length) {
        newSelectIndex = 0;
      }
      this.select(_tabIframeArray[newSelectIndex]);
    },

    selectPrevious: function() {
      let newSelectIndex = _selectIndex - 1;
      if (newSelectIndex < 0) {
        newSelectIndex = _tabIframeArray.length - 1;
      }
      this.select(_tabIframeArray[newSelectIndex]);
    },

    getSelected: function() {
      return _tabIframeArray[_selectIndex];
    },

    getCount: function() {
      return _tabIframeArray.length;
    },

    getTabPosition: function(tabIframe) {
      return _tabIframeArray.indexOf(tabIframe);
    },
  }

  TabIframeDeck[Symbol.iterator] = function*() {
    for (let tabIframe of _tabIframeArray) {
      yield tabIframe;
    }
  }

  EventEmitter.decorate(TabIframeDeck);

  TabIframeDeck.restoreSession();

  RegisterKeyBindings(
    ['',              'Esc',        () => TabIframeDeck.getSelected().stop()],
    ['Ctrl',          'Tab',        () => TabIframeDeck.selectNext()],
    ['Ctrl Shift',    'code:9',     () => TabIframeDeck.selectPrevious()],
    ['',              'F5',         () => TabIframeDeck.getSelected().reload()]
  );

  if (window.OS == 'linux' || window.OS == 'windows') {
    RegisterKeyBindings(
      ['Ctrl',          't',          () => TabIframeDeck.add({select: true})],
      ['Ctrl',          'r',          () => TabIframeDeck.getSelected().reload()],
      ['Alt',           'Left',       () => TabIframeDeck.getSelected().goBack()],
      ['Alt',           'Right',      () => TabIframeDeck.getSelected().goForward()],
      ['Ctrl',          'w',          () => TabIframeDeck.remove(TabIframeDeck.getSelected())],
      ['Ctrl Shift',    '+',          () => TabIframeDeck.getSelected().zoomIn()],
      ['Ctrl',          '=',          () => TabIframeDeck.getSelected().zoomIn()],
      ['Ctrl',          '-',          () => TabIframeDeck.getSelected().zoomOut()],
      ['Ctrl',          '0',          () => TabIframeDeck.getSelected().resetZoom()]
    );
  }

  if (window.OS == 'osx') {
    RegisterKeyBindings(
      ['Cmd',       't',          () => TabIframeDeck.add({select: true})],
      ['Cmd',       'r',          () => TabIframeDeck.getSelected().reload()],
      ['Cmd',       'Left',       () => TabIframeDeck.getSelected().goBack()],
      ['Cmd',       'Right',      () => TabIframeDeck.getSelected().goForward()],
      ['Cmd',       'w',          () => TabIframeDeck.remove(TabIframeDeck.getSelected())],
      ['Cmd Shift', '+',          () => TabIframeDeck.getSelected().zoomIn()],
      ['Cmd',       '=',          () => TabIframeDeck.getSelected().zoomIn()],
      ['Cmd',       '-',          () => TabIframeDeck.getSelected().zoomOut()],
      ['Cmd',       '0',          () => TabIframeDeck.getSelected().resetZoom()]
    );
  }

  return TabIframeDeck;
});
