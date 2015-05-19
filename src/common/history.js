/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
define((require, exports, module) => {
  'use strict';

  const PouchDB = require('pouchdb');
  const {spawn, async, schedule} = require('lang/task');
  const {identity} = require('lang/functional');
  const {Record, List, Maybe, Any, Union} = require('typed-immutable/index');

  // PouchDB has a sepcial field `_id` for identifing records
  // and `_rev` for identifiying revisitions. We will refer to
  // those properties as `[PouchDB.id]` & `[PouchDB.revision]`
  // instead.
  PouchDB.id = "_id";
  PouchDB.revision = "_rev";


  // Type aliases that may be enhanced further sometime later.
  const ID = String
  const Revision = String;
  const TimeStamp = Number;
  const Type = String;
  const URI = String;
  const TagName = String;
  const Blob = Any;


  // Helper function to convert string to a ArrayBuffer instance.
  const stringToBuffer = string => new TextEncoder().encode(string);
  // Helper function to create cryptographic hash of the content.
  const sha = string => crypto.subtle.digest("SHA-256",
                                             stringToBuffer(string)).then(btoa);

  const stub = record => record.constructor.Stub(record);
  const hash = record => record.constructor.hash(record);

  const read = async(function*(db, record) {
    try {
      const data = yield db.get(record[PouchDB.id]);
      return new record.constructor(data);
    } catch (error) {
      if (error.status !== 404) {
        throw error
      }
      return record;
    }
  });

  const upsert = function*(db, record, change) {
    while (true) {
      const current = yield read(db, record);
      try {
        return db.put(change(current).toJSON());
      } catch (error) {
        if (error.status !== 409) {
          throw error
        }
      }
    }
  };

  const push = x => xs => xs.push(x);
  const remove = x => xs => xs.remove(x);

  const exclude = x => xs => {
    const index = xs.indexOf(x)
    return index < 0 ? xs :
           index == 0 ? xs.rest() :
           index + 1 == xs.size ? xs.butLast() :
           xs.take(index).concat(xs.skip(index + 1))
  }
  const include = x => xs => xs.indexOf(x) < 0 ? xs.push(x) : xs


  /*
  ## Interests API

  ### Pages

  Pages store contains records of pages that have being visited by a user.
  Pages store contains records of the following schema (which could be extended
  in the future).

  {
    _id: "Page/http://learnyouahaskell.com/introduction#about-this-tutorial",
    uri: "http://learnyouahaskell.com/introduction#about-this-tutorial",
    title: "Introduction - Learn You a Haskell for Great Good!",
    backgroundColor: "rgb(255, 255, 255)",
    visits: [
      {
        start: 1421434329682266,
        end: 1421434484899,
        device: "Desktop"
      }
    ],
    tags: [
      "haskell",
      "functional"
    ]
  }
  */

  const Visit = Record({
    type: Type('Visit'),
    start: TimeStamp,
    end: Maybe(TimeStamp),
    id: String, // This is a web view ID in our case.
    device: String('Desktop'),
  });

  const Page = Record({
    [PouchDB.id]: ID,
    [PouchDB.revision]: Maybe(Revision),
    type: Type('Page'),
    uri: URI,
    title: Maybe(String),
    visits: List(Visit),
    tags: List(TagName),
    icon: Maybe(URI), // Would be better if it was Blob as well.
    image: Blob,
  });
  Page.frequency = ({visits}) => visits.count();
  Page.from = ({uri, title}) => Page({[PouchDB.id]: `Page/${uri}`, uri, title});

  Page.beginVisit = ({time, id, device}) => page =>
    page.update('visits', push(Visit({start: time, id, device})));


  Page.endVisit = ({id, time}) => page => {
    const index = page.visits.findIndex(visit => visit.id === id);
    return index < 0 ? page : page.setIn(['visits', index, 'end'], time);
  };


/**

### Quotes

Quotes store contains records of quotes that have being created by a user that
have a following structure.


{
  _id: "quote/W29iamVjdCBBcnJheUJ1ZmZlcl0=",
  content: `If you say that <span class="fixed">a</span> is 5, you can't say it's something else later because you just said it was 5. What are you, some kind of liar? So in purely functional languages, a function has no side-effects. The only thing a function can do is calculate something and return it as a result.`
  uri: "http://learnyouahaskell.com/introduction#about-this-tutorial",
  tags: ["functional"]
}
**/

  const Quote = Record({
    [PouchDB.id]: ID,
    [PouchDB.revision]: Maybe(Revision),

    type: Type('Quote'),
    uri: URI,
    content: String,
    tags: List(TagName)
  });

  Quote.construct = async(function* ({uri, content}) {
    const hash = yield sha(content);
    return Quote({[PouchDB.id]: `Quote/${uri}/${hash}`, uri, content});
  });


  /**
  {
    _id: "tag/haskell",
    description: "Haskell programming language",
    name: "haskell",
    items: [
      "Quote/W29iamVjdCBBcnJheUJ1ZmZlcl0="
      "Page/http://learnyouahaskell.com"
    ]
  }
  **/

  const Tag = Record({
    [PouchDB.id]: ID,
    [PouchDB._rev]: Maybe(Revision),
    type: Type("Tag"),
    name: TagName,
    items: List(ID)
  });

  Tag.add = (tag, item) =>
    tag.update('items', include(item[PouchDB.id]));

  Tag.remove = (tag, item) =>
    tag.update('items', exclude(item[PouchDB.id]));

  Tag.tag = (item, tagName) => item.update('tags', include(tagName));

  Tag.untag = (item, tagName) => item.update('tags', exclude(tagName));

  const TopPages = Record({
    [PouchDB.id]: ID('TopPages'),
    [PouchDB.revision]: Maybe(Revision),
    type: Type('TopPages'),
    pages: List(Page)
  });
  TopPages.sample = (page, limit) => top => top.update('pages', pages => {
    const index = pages.findIndex(x => x[PouchDB.id] === page[PouchDB.id])
    return pages.set(index < 0 ? pages.size : index, page)
                .sortBy(Page.frequency)
                .take(limit);
  });

  const PopularSitesImported = Record({
    [PouchDB.id]: ID('PopularSitesImported'),
    [PouchDB.revision]: Maybe(Revision),
    value: Boolean(false)
  });


  // History
  class History {
    static defaults() {
      return {
        name: 'history',
        topPageLimit: 6,
        address: null
      }
    }
    constructor(options={}) {
      this.onPageChange = this.onPageChange.bind(this);

      this.options = Object.assign(History.defaults(), options);
      this.db = new PouchDB(this.options);

      this.trackTopPages();
      this.importPopularSites();
    }
    importPopularSites() {
      spawn.call(this, function*() {
        const imported = yield read(this.db, PopularSitesImported());
        if (!imported.value) {
          const request = yield fetch('src/alexa.json');
          const sites = yield request.json();

          const tasks = sites.map(site =>
            this.edit(Page.from({uri: `http://${site}/`, title: site}), identity))

          yield Promise.all(tasks);

          yield this.edit(imported, record => record.set('value', true));
        }
      });
    }
    trackTopPages() {
      this.pagesChangeFeed = this.db.changes({
        since: "now",
        live: true,

        filter: ({[PouchDB.id]: id}) => id.startsWith("Page/"),
        include_docs: true
      });

      this.pagesChangeFeed.on("change", this.onPageChange);
    }

    // Edits are scheduled by a record id to avoid obvious conflicts with
    // in the same node transations.
    edit(record, change) {
      return schedule(record[PouchDB.id], upsert, this.db, record, change);
    }

    clear() {
      return this.db.destroy();
    }

    query({type, docs}) {
      return this.db.allDocs({
        include_docs: docs,
        startkey: type && `${type}/`,
        endkey: type && `${type}/\uffff`
      });
    }

    onPageChange({doc}) {
      const page = Page(doc);
      this.edit(TopPages(),
                TopPages.sample(page, this.options.topPageLimit));

      if (this.options.address) {
        this.options.address.send(page);
      }
    }
  };

  exports.History = History;
  exports.Page = Page;
  exports.Tag = Tag;
  exports.TopPages = TopPages;
  exports.Quote = Quote;
});
