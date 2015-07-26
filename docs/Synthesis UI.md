# UI interactions in various modes

Document describes modes that browser.html could be in & how various UI components will behave in that mode based of the **Synthesis UI / Jun 15, 2015** specification.

## Actions

- `ShowWebView`
- `ShowWebViewByID`
- `CreateWebView`
- `EditWebView`
- `ChooseNextWebView`
- `ChoosePreviousWebView`
- `Escape`
- `CloseWebView`

## Modes

Application state will have a `mode` of string type that maybe set to on of the following values:

- `'show-web-view'`
  Default mode. Activated by `ShowWebView` action.
- `'create-web-view'`
  Activated by `CreateWebView` action.
- `'edit-web-view'`
  Activated by `EditWebView`, `CloseWebView` action.
- `'choose-web-view'`
  Activated by `ChooseNextWebView` / `ChoosePreviousWebView` action.




## View logic

Describes view behavior based on the value of `state.mode`.


#### show-web-view

In this mode `progress-bar` is rendered and may be animating if page is loading.
The `location-bar` is visible although `location-bar-input` is not. `window-bar` is visible. Focusing `location-bar-input` triggers `EditWebView` action. Click on the `location-bar` triggers `EditWebView` action. In this mode `previews` is not visible (should even render it ? but then if we zoom dashboard maybe in odd state). Keybinding `accel l` triggers `EditWebView` action. Keybinding `accel t` in this mode triggers `CreateWebView` action. Clicking `new-tab-button` triggers `CreateWebView` action. Pinch gesture triggers `EditWebView` action. Keybindings `ctrl-tab` / `ctrl-shift-tab`, `cmd-shift-]` / `cmd-shift-[` trigger `ChooseNextWebView / ChoosePreviousWebView` action. `CloseWebView` action.

#### create-web-view

In this mode `progress-bar` is not rendered (or is halted does not respond to state changes). `window-bar` is not visible. `location-bar-input` is focused, and it keeps focus regardless of user interaction unless that interaction causes a mode switch. `web-views` are scaled to `0`. Actions like `SelectByOffset` have no (or no visible ?) effect. Selected card highlighting is not displayed. Dashboards is rendered with a "ghost card" on the left. `CreateWebView` action is ignored (or maybe we just use a different keybindings per mode ?). `Escape` key triggers `Escape` action that clears `location-bar-input`. If `state.input.value` is `null || ''` `Escape` action is treated as `ShowWebView` action. Keybindings `ctrl-tab` / `ctrl-shift-tab`, `cmd-shift-]` / `cmd-shift-[` trigger `ChooseNextWebView / ChoosePreviousWebView` action.

**To be determined**

- What happens if card is clicked ?
- What happens on zoom in gesture ?
- What happens on `accel l` keybinding ?

#### edit-web-view

In this mode `progress-bar` is not rendered (or is halted). `window-bar` is not visible. `location-bar-input` is focused and selected. Selected card is highlighted. `web-views` is scaled to `0`. Actions like `SelectByOffset` change selected tab and there for highlighting of card is updated as well. `SelectByOffset` also updates `location-bar-input` to reflect the selected tab `uri`. `accel t` triggers `CreateWebView` action. `Escape` triggers `ShowWebView` action. Clicking a card triggers `ShowWebViewByID`. `accel l` triggers `EditWebView` action. Keybindings `ctrl-tab` / `ctrl-shift-tab`, `cmd-shift-]` / `cmd-shift-[` trigger `ChooseNextWebView / ChoosePreviousWebView` action.

#### choose-web-view

In this mode `progress-bar` is not rendered (or is halted). `window-bar` is not visible. `web-views` is scaled to `0`. `location-bar-input` is not focused but is visible. Releasing `ctrl / cmd` key triggers `ShowWebView` action.


## Business logic

Describes state `update` behavior based of `state` and received `action`.

#### ShowWebView

Changes `state.mode` to `'show-web-view'`.

#### ShowWebViewByID

Does pretty much what `ShowWebView` does with except that `state.webViews.selected` is set to the index that matches `action.id`.

#### CreateWebView

Sets `state.mode` to `'create-web-view'`. If `state.mode` isn't already a `'create-web-view'` then sets `state.input.value` to `null`.

#### EditWebView

Sets `state.mode` to `'edit-web-view'`. If `state.mode` is not already a `'edit-web-view'` then sets `state.input.value` to `state.webViews.loader.get(state.webViews.selected).uri`.


#### ChooseNextWebView / ChoosePreviousWebView

Sets `state.mode` to `'choose-web-view'`. Updates `state.webViews.selected` with +1 / -1.

#### Escape

If `state.input.value` isn't `null` sets it to `null` otherwise sets `state.mode` to `'show-web-view'`.

#### CloseWebView

Goes through regular `WebViews.update(state.webViews, Close())` routine and then does `Browser.update(state, EditWebView())` routine.
