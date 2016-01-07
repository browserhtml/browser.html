import {html, thunk, Effects} from 'reflex';
import * as Easing from "eased";
import {Style, StyleSheet} from '../../common/style';
import * as Stopwatch from "../../common/stopwatch";
import {cursor, merge} from "../../common/prelude";
import * as Target from "../../common/target";
import * as Unknown from "../../common/unknown";
import * as WebView from '../web-view';

export const Model
  = ({isPointerOver}) =>
  ({isPointerOver
  , animation: null
  , display
      : isPointerOver
      ? {opacity: 1}
      : {opacity: 0}
  });

export const initial = Model({isPointerOver: false});

const Point = action => ({type: "Point", action});
const Animation = action => ({type: "Animation", action});

const stopwatch = cursor({
  tag: Animation,
  get: model => model.animation,
  set: (model, animation) => merge(model, {animation}),
  update: Stopwatch.step
});

const point = cursor({
  update: Target.step,
  tag: Point
});

// @TODO handle tab width and title opacity animations here
// instead of in Sidebar.
const interpolate = (from, to, progress) => merge(from, {
  opacity: Easing.float(from.opacity, to.opacity, progress),
});

const animationProjection = model =>
    model.isPointerOver
  ? {opacity: 1}
  : {opacity: 0};

const animate = (model, action) => {
  const [{animation}, fx] = stopwatch(model, action.action)
  const duration = 200;

  // @TODO: We should not be guessing what is the starnig point
  // that makes no sense & is likely to be incorrect at a times.
  // To fix it we need to ditch this easing library in favor of
  // something that will give us more like spring physics.
  const begin
    = isPointerOver
    ? {opacity: 0}
    : {opacity: 1};

  const projection = animationProjection(model);

  return duration > animation.elapsed
    ? [ merge(model, {
          animation,
          display: Easing.ease
            ( Easing.easeOutCubic
            , interpolate
            , begin
            , projection
            , duration
            , animation.elapsed
            )
        })
      , fx
      ]
    : [ merge(model, {animation, display: projection})
      , fx.map(AnimationEnd)
      ]
}

export const update = (model, action) =>
    action.type === "Animation"
  ? animate(model, action)
  : action.type === "AnimationEnd"
  ? stopwatch(model, Stopwatch.End)
  : action.type === "Show"
  ? stopwatch(merge(model, {isOpen: true}), Stopwatch.Start)
  : action.type === "Hide"
  ? stopwatch(merge(model, {isOpen: false}), Stopwatch.Start)
  : action.type === "Point"
  ? point(model, action.action)
  : Unknown.step(model, action);

const style = StyleSheet.create({
  tab: {
    MozWindowDragging: 'no-drag',
    borderRadius: '5px',
    height: '34px',
    color: '#fff',
    overflow: 'hidden',
  },

  tabInner: {
    height: '34px',
    lineHeight: '34px',
    width: '312px',
    color: '#fff',
    fontSize: '14px',
    overflow: 'hidden',
    position: 'relative'
  },

  tabSelected: {
    backgroundColor: '#3D91F2'
  },

  closeMask: {
    background: `linear-gradient(
      to right,
      rgba(36,48,61,0) 0%,
      rgba(36,48,61,1) 20%,
      rgba(36,48,61,1) 100%)`,
    width: '34px',
    height: '34px',
    position: 'absolute',
    paddingLeft: '10px',
    right: 0,
    top: 0
  },

  closeMaskSelected: {
    background: `linear-gradient(
      to right,
      rgba(61,145,242,0) 0%,
      rgba(61,145,242,1) 20%,
      rgba(61,145,242,1) 100%)`
  },

  closeMaskHidden: {
    opacity: 0,
    pointerEvents: 'none'
  },

  closeIcon: {
    color: '#fff',
    fontFamily: 'FontAwesome',
    fontSize: '12px',
    width: '34px',
    height: '34px',
    lineHeight: '34px',
    textAlign: 'center'
  },

  title: {
    display: 'block',
    margin: '0 10px 0 34px',
    overflow: 'hidden',
    width: '270px',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },

  favicon: {
    borderRadius: '3px',
    left: '9px',
    position: 'absolute',
    top: '9px',
    width: '16px',
    height: '16px',
  }
});

const viewClose = ({isSelected, isPointerOver}, address) =>
  html.div({
    className: 'tab-close-mask',
    style: Style(
      style.closeMask,
      isSelected && style.closeMaskSelected,
      !isPointerOver && style.closeMaskHidden
    )
  }, [
    html.div({
      className: 'tab-close-icon',
      style: style.closeIcon,
      onClick: () => address(WebView.Close)
    }, [''])
  ]);


const viewImage = (uri, style) =>
  html.img({
    style: Style({
      backgroundImage: `url(${uri})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
      backgroundRepeat: 'no-repeat',
      border: 'none'
    }, style)
  });

export const view = (model, address, {tabWidth, titleOpacity}) =>
  html.div({
    className: 'sidebar-tab',
    style: Style(
      style.tab,
      model.isSelected && style.tabSelected,
      {width: `${tabWidth}px`}
    ),
    onMouseOver: () => address(Point(Target.Over)),
    onMouseOut: () => address(Point(Target.Out)),
    onMouseDown: () => address(WebView.Select),
    onMouseUp: () => address(WebView.Activate)
  }, [
    html.div({
      className: 'sidebar-tab-inner',
      style: style.tabInner
    }, [
      thunk('favicon',
            viewImage,
            WebView.readFaviconURI(model),
            style.favicon),
      html.div({
        className: 'sidebar-tab-title',
        style: Style(
          style.title,
          {opacity: titleOpacity}
        )
      }, [
        // @TODO localize this string
        WebView.readTitle(model, 'Untitled')
      ]),
      thunk('close', viewClose, model, address)
    ])
  ]);
