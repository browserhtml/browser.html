importScripts("../../node_modules/requirejs/require.js");

require.config({
  nodeIdCompat: true,
  baseUrl: "../../node_modules/",
  paths: {
    browser: '../src/browser',
    common: '../src/common',
    lang: '../src/lang',
    service: '../src/service',
    // http://facebook.github.io/react/
    react: 'react/dist/react',
    // http://facebook.github.io/immutable-js/
    // Because of the bug https://github.com/facebook/immutable-js/pull/297
    // we use forked version until it's uplifted.
    immutable: 'immutable/dist/immutable',
    'typed-immutable': 'typed-immutable/lib/',
    // https://github.com/broofa/node-uuid
    uuid: 'node-uuid/uuid',
    reflex: 'reflex/lib/index',
    pouchdb: 'pouchdb/dist/pouchdb',
    tinycolor: 'tinycolor2/tinycolor'
  },
  shim: {
    tinycolor: {
      exports: 'tinycolor'
    },
    pouchdb: {
      exports: 'PouchDB'
    }
  }
});

// Calculates the score for use in suggestions from
// a result array `match` of `RegExp#exec`.
const score = (pattern, input='', base=0.3, length=0.25) => {
    const index = 1 - base - length
    const text = String(input);
    const count = text.length;
    const match = pattern.exec(text);

    return !match ? -1 :
            base +
            length * Math.sqrt(match[0].length / count) +
            index * (1 - match.index / count);
}

const Pattern = (input, flags="i") => {
  try {
    return RegExp(input, flags)
  } catch (error) {
    if (error instanceof SyntaxError) {
      return RegExp(pattern.escape(input), flags)
    }
    throw error
  }
}
Pattern.escape = input => input.replace(/[\.\?\*\+\^\$\|\(\)\{\[\]\\]/g, '\\$&')


require(['common/history', 'lang/task'], ({Page, History}, {async}) => {
  const pageSearch = async(function*(db, {id, input, limit}) {
    const {rows} = yield db.query({docs: true, type: 'Page'});
    // Build a query patter from all words and individual words, note that
    // scoring will take into consideration the length of the match so if we match
    // multiple words that gets larger score then if we matched just one.

    const query = Pattern(input.split(/\s+/g).join('[\\s\\S]+') +
                          '|' + input.split(/\s+/g).join('|'));
    const matches = rows.map(({doc: page}) => {
      // frequency score is ranked from 0-1 not based on quality of
      // match but solely on how often this page has been visited in the
      // past.
      const frequencyScore = 1 - (0.7 / (1 + page.visits.length));
      // Title and uri are scored based of input length & match length
      // and match index.
      const titleScore = score(query, page.title);
      const uriScore = score(query, page.uri);

      // Store each score just for debuging purposes.
      page.frequencyScore = frequencyScore;
      page.titleScore = titleScore;
      page.uriScore = uriScore;

      // Total score is ranked form `-1` to `1`. Score is devided into
      // 15 slots and individual field get's different weight based of
      // portion it can contribute to of over score. No match on individual
      // field has a negative impact (again besed on it's weight) on actual
      // score. Assigned weight will likely need some tuning right now
      // frequencey of visits has a largest wegiht (almost half but less than
      // half so that no match will still exclude the result). Title has higher
      // weight than uri as search engines tend to add search term in terms of
      // query arguments (probably would make sense to score query arguments &
      // uri hash separately so they weight less, althouh since scoring is length
      // and index based match in query already get's scored less).
      page.score = frequencyScore * 7/15 +
                   titleScore * 5/15 +
                   uriScore * 3/15;

      return page;
    })
    .filter(page => page.score > 0 && page.title)
    // order by score.
    .sort((a, b) =>
      a.score > b.score ? -1 :
      a.score < b.score ? 1 :
      0)
    .slice(0, limit);

    return {
      type: 'PageResult',
      action: {id, results: matches}
    };
  });

  const history = new History({trackTopPages: true});

  onmessage = ({data: {type, action}}) => {
    if (type === 'LoadEnd') {
      history.edit(Page.from({uri: action.uri}),
                   Page.beginVisit({id: action.id,
                                    time: action.timeStamp}));
    }

    if (type === 'LocationChange') {
      history.edit(Page.from({uri: action.uri}),
                   Page.endVisit({id: action.id,
                                  time: action.timeStamp}));
    }

    if (type === 'TitleChange') {
      history.edit(Page.from({uri: action.uri}),
                   page => page.set('title', action.title));
    }

    if (type === 'ThumbnailChange') {
      history.edit(Page.from({uri: action.uri}),
                   page => page.set('image', action.image));
    }

    if (type === 'IconChange') {
      history.edit(Page.from({uri: action.uri}),
                   page => page.set('icon', action.icon));
    }

    if (type === 'PageQuery') {
      pageSearch(history, action).then(postMessage);
    }
  }
});
