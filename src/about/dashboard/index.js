/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {
  'use strict';

  const {main} = require('reflex');
  const Dashboard = require('./dashboard');

  const pages = [
    {image: 'tiles/facebook.com.png',
     uri: 'https://facebook.com',
     title: 'facebook.com'},
    {image: 'tiles/youtube.com.png',
     uri: 'https://youtube.com',
     title: 'youtube.com'},
    {image: 'tiles/amazon.com.png',
     uri: 'https://amazon.com',
     title: 'amazon.com'},
    {image: 'tiles/wikipedia.org.png',
     uri: 'https://wikipedia.org',
     title: 'wikipedia.org'},
    {image: 'tiles/twitter.com.png',
     uri: 'https://twitter.com',
     title: 'twitter.com'},
    {image: 'tiles/mail.google.com.png',
     uri: 'https://mail.google.com',
     title: 'mail.google.com'},
    {image: 'tiles/nytimes.com.png',
     uri: 'https://nytimes.com',
     title: 'nytimes.com'},
    {image: 'tiles/qz.com.png',
     uri: 'http://qz.com',
     title: 'qz.com'},
    {image: 'tiles/github.com.png',
     uri: 'https://github.com',
     title: 'github.com'},
    {image: 'tiles/dropbox.com.png',
     uri: 'https://dropbox.com',
     title: 'dropbox.com'},
    {image: 'tiles/linkedin.com.png',
     uri: 'https://linkedin.com',
     title: 'linkedin.com'},
    {image: 'tiles/yahoo.com.png',
     uri: 'https://yahoo.com',
     title: 'yahoo.com'}
  ];

  const themes = [
    {
      id: 'default',
      pallet: {
        isDark: false
      },
      wallpaper: {
        background: '#F0F4F7',
      }
    },
    {
      id: 'dark',
      pallet: {
        background: '#2E434B',
        foreground: '#eee',
        isDark: true,
      },
      wallpaper: {
        background: '#25363D',
        foreground: '#eee',
      }
    },
    {
      id: 'shore',
      pallet: {
        background: '#078',
        foreground: '#eee',
        isDark: true,
      },
      wallpaper: {
        background: '#078',
        foreground: 'rgb(255,255,255)',
        posterImage: 'wallpaper/shore.jpg'
      }
    },
    {
      id: 'dandilion',
      pallet: {
        background: '#112935',
        foreground: '#eee',
        isDark: true,
      },
      wallpaper: {
        background: '#134',
        foreground: 'rgb(255,255,255)',
        posterImage: 'wallpaper/dandilion.jpg'
      }
    },
    {
      id: 'dock',
      pallet: {
        background: '#437',
        foreground: '#fff',
        isDark: true,
      },
      wallpaper: {
        background: '#437',
        foreground: 'rgb(255,255,255)',
        posterImage: 'wallpaper/dock.jpg'
      }
    }
  ];


  const app = main(document.body,
                   Dashboard.Model({pages, themes: {entries: themes}}),
                   Dashboard.update,
                   Dashboard.view);
});
