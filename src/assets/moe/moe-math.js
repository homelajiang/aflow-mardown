/*
 *  This file is part of Moeditor.
 *
 *  Copyright (c) 2016 Menci <huanghaorui301@gmail.com>
 *
 *  Moeditor is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  Moeditor is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with Moeditor. If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

var LRUCache = require('lrucache');
var rendered = LRUCache(1024);
var katex = require('katex');

// require('mathjax');

var mathjax = null;

module.exports = class MoeditorMathRenderer {

  static renderMany(a, cb) {
    if (a === []) {
      cb(a);
      return;
    }
    let div = document.createElement('div');
    div.style.width = div.style.height = 0;
    div.style.visibility = 'hidden';
    document.body.appendChild(div);
    for (let id in a) {
      let span = document.createElement('span');
      span.innerText = (a[id].display ? '$$' : '$') + a[id].s + (a[id].display ? '$$' : '$');
      span.id = id;
      div.appendChild(span);
    }
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, div]);
    MathJax.Hub.Queue(() => {
      for (let id in a) {
        let span = div.querySelector('#' + id);
        a[id].res = (span.querySelector('svg') || span).outerHTML;
        if (a[id].display) {
          a[id].res = '<div style="width: 100%; text-align: center">' + a[id].res + '</div>';
        }
        rendered.set((a[id].display ? 'd' : 'i') + a[id].s, a[id].res);

      }
      document.body.removeChild(div);
      cb(a);
    });
  }

  static tryRender(str, display) {
    var res = rendered.get((display ? 'd' : 'i') + str);
    if (res === undefined) {
      try {
        res = katex.renderToString(str, {displayMode: display});
        rendered.set((display ? 'd' : 'i') + str, res);
      } catch (e) {
        res = undefined;
      }
    }
    return res;
  }
};
