/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  'use strict';

  const {Record, Union, List} = require('../common/typed');
  const Loader = require('../browser/web-loader');
  const Page = require('../browser/web-page');
  const WebView = require('../browser/web-view');

  const scrape = () => {
    /*
    Pull structured content out of the DOM.

    - Hero images
    - Title
    - Summary
    - Site name
    - Article content

    Things we can use:
    - `<title>`
    - meta description
    - Twitter card meta tags
    - Facebook Open Graph tags
    - Win8 Tile meta tags
    - meta description
    - Search snippet things like schema.org
    - microformats

    https://github.com/mozilla/readability
    http://schema.org/CreativeWork
    https://dev.twitter.com/cards/markup
    https://developers.facebook.com/docs/sharing/webmasters#markup
    https://developer.apple.com/library/ios/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html
    http://blogs.msdn.com/b/ie/archive/2014/05/21/support-a-live-tile-for-your-website-on-windows-and-windows-phone-8-1.aspx
    http://www.oembed.com/
    https://developer.chrome.com/multidevice/android/installtohomescreen
    */

    // Transducers
    // -----------------------------------------------------------------------------

    // Box a value, marking it reduced.
    const reduced = (value) => ({value: value, reduced: reduced});
    const isReduced = (x) => x && x.reduced === reduced;
    // Unwrap a value if it is boxed with a given tag.
    const unbox = (x) => x.value;

    // A special reduce function that works with any indexed collection and allows
    // us to return early by boxing value with `reduced`.
    const reduce = (indexed, step, result) => {
      for (var i = 0; i < indexed.length; i++) {
        result = step(result, indexed[i]);
        // If value was reduced early, take the fast path and end reduction.
        if (isReduced(result)) return unbox(result);
      }
      return result;
    }

    // Transform elements using a transducer transform function.
    // See http://clojure.org/transducers.
    const transduce = (xf, indexed, step, result) =>
      // The transform function transforms the `step` function before reduction,
      // which allows you to transform items in the list before allocating array
      // space for them.
      reduce(indexed, xf(step), result);

    // Add something to the end of an array.
    const append = (array, x) => {
      // Only append if value is not null.
      if (x != null) array.push(x);
      // Return array. This is useful when writing terse functions for `reduce`.
      return array;
    }

    // Transform items with transducer function, then collect them in an array.
    const into = (xf, indexed) => transduce(xf, indexed, append, []);

    // Mapping transducer function.
    // Transforms the `step` function so that any `input` is first passed through
    // function `a2b`.
    const map = (a2b) => (step) => (result, input) =>
      step(result, a2b(input));

    // Filtering transducer function.
    // Transforms the `step` function so that it ignores any `input` that does not
    // pass the `predicate` function.
    const filter = (predicate) => (step) => (result, input) =>
      predicate(input) ? step(result, input) : result;

    // Just like `filter` above, but only keeps things that fail `predicate` test.
    const reject = (predicate) => (step) => (result, input) =>
      !predicate(input) ? step(result, input) : result;

    // Transducer function to take first `n` values, then stop reduction.
    // Returns `xform` function.
    const take = (n) => (step) => (result, input) => {
      if (n > 0) {
        n = n - 1;
        return step(result, input);
      } else {
        // Once we reach 0 on our counter, stop reduction.
        return reduced(result);
      }
    }

    // Compose 2 functions.
    const comp2 = (x, y) => (v) => x(y(v));

    // Compose n functions.
    const comp = (f, ...fns) => reduce(fns, comp2, f);

    // Utils
    // -----------------------------------------------------------------------------

    const getText = (el) => el.textContent;

    const getContent = (metaEl) => metaEl.content;

    const getSrc = (imgEl) => imgEl.src;

    // Construct a sequence of fallbacks. Each function in `fns` is called in turn
    // with `x` has a chance to return a value. If that value is `null`, the next
    // function is called, and so-on until we have a value.
    // If all return `null`, then `fallback` is used.
    //
    // @TODO determine if I should instead build functions that collect all possible
    // matches as an array. In this case, `queries` would return an array of 0 or
    // more. I guess that would let me score the list, rather than picking a "best"
    // one by order.
    const any = (...fns) => (x, fallback) => reduce(fns, (fallback, f) => {
      const result = f(x);
      return result != null ? reduced(result) : fallback;
    }, fallback);

    const id = (x) => x;

    // Create a function that will query the first available match for
    // `selector` in `pageEl`. `a2b` function transforms the result on the way out.
    // We use this with `fallbacks` to easily construct page crawlers with a
    // sequence of fallbacks, below.
    const queries = (selector, a2b) => (pageEl) => {
      a2b = a2b || id;
      const result = pageEl.querySelector(selector);
      return result != null ? a2b(result) : null;
    }

    // Does element match a particular tag name?
    const matchesTag = (el, pattern) => el.tagName.search(pattern) !== -1;

    const matchesClass = (el, pattern) => el.className.search(pattern) !== -1;

    // Scraping and content scoring helpers
    // -----------------------------------------------------------------------------

    // Score the content-y-ness of a string. Note that this is an imperfect score
    // and you'll be better off if you combine it with other heuristics like
    // element classname, etc.
    const scoreContentyness = (text) => {
      // If paragraph is less than 25 characters, don't count it.
      if (text.length < 25) return 0;

      // Ok, we've weeded out the no-good cases. Start score at one.
      var score = 1;

      // Add points for any commas within.
      score = score + text.split(',').length;

      // For every 100 characters in this paragraph, add another point.
      // Up to 3 points.
      score = score + Math.min(Math.floor(text.length / 100), 3);

      return score;
    }

    // Score a child element to find out how "content-y" it is.
    // A score is determined by things like number of commas, etc.
    // Maybe eventually link density.
    const scoreElContentyness = (el) => {
      return scoreContentyness(getText(el));
    }

    const isSufficientlyContenty = (el) => {
      return scoreElContentyness(el) > 3;
    }

    const UNLIKELY_CONTENT_CLASSNAMES = /date|social|community|remark|discuss|disqus|e[\-]?mail|rss|print|extra|share|login|sign|reply|combx|comment|com-|contact|header|menu|foot|footer|footnote|masthead|media|meta|outbrain|promo|related|scroll|shoutbox|sidebar|sponsor|shopping|tags|tool|widget|sidebar|sponsor|ad-break|agegate|pagination|pager|popup|tweet|twitter/i;

    const isUnlikelyCandidate = (el) => matchesClass(el, UNLIKELY_CONTENT_CLASSNAMES);

    const countWords = (text) => text.split(/\s/).length;

    // Is text long enough to be content?
    const isSufficientlyLong = (text) => text.length > 25;
    const isTextSufficientlyLong = comp(isSufficientlyLong, getText);

    const getElTextLength = comp((x) => x.length, getText);
    const sum = (a, b) => a + b;

    // Calculat the density of links in content.
    const calcLinkDensity = (el) => {
      const linkLength =
        transduce(map(getElTextLength), el.querySelectorAll('a'), sum, 0);
      const textLength = getElTextLength(el);

      return linkLength / textLength;
    };

    // Is the link density of this element high?
    const isHighLinkDensity = (el) => calcLinkDensity(el) > 0.5;

    // Extract a clean title from text that has been littered with separator
    // garbage.
    const cleanTitle = (text) => {
      var title = text;
      if (text.match(/\s[\|\-:]\s/)) {
        title = text.replace(/(.*)[\|\-:] .*/gi, '$1');

        if (countWords(title) < 3) {
          title = text.replace(/[^\|\-]*[\|\-](.*)/gi, '$1');
        }

        // Fall back to title if word count is too short.
        if (countWords(title) < 5) {
          title = text;
        }
      }

      // Trim spaces.
      return title.trim();
    }


    // Content scrapers
    // -----------------------------------------------------------------------------

    // Find a good title within page.
    // Usage: `scrapeTitle(htmlEl, 'Untitled')`.
    const scrapeTitle = any(
      queries('meta[property="og:title"], meta[name="twitter:title"]', getContent),
      // Query hentry Microformats. Note that we just grab the blog title,
      // even on a blog listing page. You're going to associate the first title
      // with the identity of the page because it's the first thing you see on
      // the page when it loads.
      queries('.entry-title, .h-entry .p-name', getText),
      // @TODO look at http://schema.org/Article `[itemprop=headline]`
      queries('title', comp(cleanTitle, getText)),
      // If worst comes to worst, fall back on headings.
      queries('h1, h2, h3', getText)
    );

    const scrapeDescriptionFromContent = (pageEl) => {
      // Query for all paragraphs on the page.
      // Trim down paragraphs to the ones we deem likely to be content.
      // Then map to `textContent`.
      const texts = into(comp(
        // First, reject things that we know to be unlikely.
        reject(isUnlikelyCandidate),
        // Text content is long enough to be content.
        filter(isTextSufficientlyLong),
        reject(isHighLinkDensity),
        filter(isSufficientlyContenty),
        map(getText)
      ), pageEl.querySelectorAll('p'));

      // Return first match, which may be undefined.
      return texts[0];
    }

    // Find a good description for the page.
    // Usage: `scrapeDescription(htmlEl, '')`.
    const scrapeDescription = any(
      // Prefer social media descriptions to `meta[name=description]` because they
      // are curated for readers, not search bots.
      queries(
        'meta[property="og:description"], meta[name="twitter:description"]',
        getContent
      ),
      // Scrape hentry Microformat description.
      queries('.entry-summary, .h-entry .p-summary', getText),
      // @TODO process description to remove garbage from descriptions.
      queries('meta[name=description]', getContent),
      // @TODO look at http://schema.org/Article `[itemprop=description]`
      scrapeDescriptionFromContent
    );

    // You probably want to use the base URL as fallback.
    const scrapeSiteName = any(
      // Prefer the standard meta tag.
      queries('meta[name="application-name"]', getContent),
      queries('meta[property="og:site_name"]', getContent),
      // Note that this one is an `@name`.
      queries('meta[name="twitter:site"]', getContent)
    );

    const isImgSizeAtLeast = (imgEl, w, h) =>
      imgEl.naturalWidth > w && imgEl.naturalHeight > h;

    const isImgHeroSize = (imgEl) => isImgSizeAtLeast(imgEl, 480, 300);

    // Collect Twitter image urls from meta tags.
    // Returns an array of 1 or more Twitter img urls, or null.
    // See https://dev.twitter.com/cards/markup.
    const queryTwitterImgUrls = (pageEl) => {
      const metas = pageEl.querySelectorAll(`
        meta[name="twitter:image"],
        meta[name="twitter:image:src"],
        meta[name="twitter:image0"],
        meta[name="twitter:image1"],
        meta[name="twitter:image2"],
        meta[name="twitter:image3"]
      `);
      // Returning different types is rather bad form, but works better for our
      // `fallbacks` function.
      return metas.length > 0 ? into(map(getContent), metas) : null;
    }

    // Collect Facebook Open Graph image meta tags.
    // Returns an aray of 0 or more meta elements.
    // These 2 meta tags are equivalent. If the first doesn't exist, look for
    // the second.
    // See https://developers.facebook.com/docs/sharing/webmasters#images.
    const queryOpenGraphImgUrls = queries(`
      meta[property="og:image"],
      meta[property="og:image:url"]
    `, (meta) => [getContent(meta)]);

    const findHeroImgUrls = (pageEl) => into(
      comp(filter(isImgHeroSize), take(4), map(getSrc)),
      pageEl.querySelectorAll('img')
    );

    // Scrape up to 4 featured images.
    // We favor meta tags like `twitter:image` and `og:image` because those are
    // hand-curated. If we don't them, we'll dig through the content ourselves.
    // Returns an array of image urls.
    // @TODO it might be better just to grab everything, then de-dupe URLs.
    const scrapeHeroImgUrls = any(
      // Note that Facebook OpenGraph image queries are kept seperate from Twitter
      // image queries. This is to prevent duplicates when sites include both.
      // If we find Twitter first, we'll return it and never look for Facebook.
      // We'll favor Twitter image URLs, since there can be more than one.
      queryTwitterImgUrls,
      queryOpenGraphImgUrls,
      findHeroImgUrls
    );

    // If we have 4 or more images, we show 4 images in combination.
    // Otherwise, use the first featured image only.
    const isImgCombo = (imgUrls) => imgUrls.length > 3;

    // @TODO need some methods for scaling and cropping images.

    const ready = new window.Promise((resolve) => {
      if (document.readyState === "complete") {
        resolve();
      } else {
        const listener = _ => {
          window.removeEventListener("load", listener);
          resolve();
        };

        window.addEventListener("load", listener);
      }
    });

    return ready.then(_ => ({
      hero: scrapeHeroImgUrls(document.documentElement),
      title: scrapeTitle(document.documentElement, ''),
      description: scrapeDescription(document.documentElement, ''),
      name: scrapeSiteName(document.documentElement, '')
    }));
  };

  const script = `(${scrape})()`;

  const readCard = (id, uri, {hero, title, description, name}) =>
    WebView.Action({
      id,
      action: Page.PageCardChanged({uri, hero, title, description, name})
    });

  const service = address => action => {
    if (action instanceof WebView.Action &&
        action.action instanceof Loader.LocationChanged)
    {
      const iframe = document.getElementById(`web-view-${action.id}`);
      if (iframe && iframe.executeScript) {
        iframe.executeScript(script, {url: iframe.location})
              .then(address.pass(readCard, action.id, action.action.uri));
      }
    }

    return action;
  };
  exports.service = service;
