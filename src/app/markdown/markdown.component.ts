import {AfterViewInit, Component, OnInit, ViewEncapsulation} from '@angular/core';
import * as CodeMirror from 'codemirror';

import MoeMark from 'moemark';

import MoeditorHighlight from '../../assets/moe/moe-highlight';
import MoeditorUMLRenderer from '../../assets/moe/moe-uml';

import MoeditorMathRender from '../../assets/moe/moe-math';

import SVGFixer from '../../assets/moe/svgfixer';


/*import * as url from 'url';
import * as path from 'path';*/

// import * as path from 'path';


import 'codemirror/mode/markdown/markdown';
import 'codemirror/mode/gfm/gfm';
import 'codemirror/addon/mode/simple';
import 'codemirror/mode/css/css';
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/haml/haml';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/jsx/jsx';
import 'codemirror/mode/php/php';
import 'codemirror/mode/python/python';
import 'codemirror/mode/powershell/powershell';
import 'codemirror/mode/ruby/ruby';
import 'codemirror/mode/shell/shell';
import 'codemirror/mode/slim/slim';
import 'codemirror/mode/sql/sql';
import 'codemirror/mode/stex/stex';
import 'codemirror/mode/textile/textile';
import 'codemirror/mode/verilog/verilog';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/xquery/xquery';
import 'codemirror/mode/rust/rust';
import 'codemirror/mode/mscgen/mscgen';
import 'codemirror/mode/dylan/dylan';
import 'codemirror/mode/meta';
import 'codemirror/addon/mode/overlay';
import 'codemirror/addon/mode/multiplex';
import 'codemirror/addon/scroll/simplescrollbars';
import 'codemirror/addon/selection/active-line';


@Component({
  selector: 'app-markdown',
  templateUrl: './markdown.component.html',
  styleUrls: ['./markdown.component.css']
})
export class MarkdownComponent implements OnInit, AfterViewInit {
  private editor: CodeMirror.EditorFromTextArea;
  private moeMark;
  private updatePreview = false;
  private updatePreviewRunning = false;
  private mdContent: string;
  private force: boolean; // 强制刷新
  private changed: boolean; // 文本是否改动
  private editMode: boolean; // 编辑模式
  private lineNumbers: number[];
  private scrollMap = new Array(2); // 滚动记录器

  // 编辑模式、预览模式


  constructor() {
  }

  ngOnInit() {

  }

  /**
   * On component view init
   */
  ngAfterViewInit() {
    this.codeMirrorInit();
    this.moeMarkInit();
  }


  codeMirrorInit() {
    this.editor = CodeMirror.fromTextArea(document.querySelector('#editor textarea'), {
      lineNumbers: true,
      // mode: moeApp.config.get('math') ? 'gfm_math' : 'gfm',
      mode: 'gfm',
      theme: 'base16-light',
      lineWrapping: true,
      extraKeys: {
        Enter: 'newlineAndIndentContinueMarkdownList',
        Home: 'goLineLeft',
        End: 'goLineRight',
        'Shift-Tab': 'indentLess'
      },
      tabSize: 4,
      indentUnit: 4,
      viewportMargin: Infinity,
      showCursorWhenSelecting: true
    });

    const codeMirror: any = document.querySelector('#editor > .CodeMirror');
    codeMirror.style.lineHeight = 2;


    this.editor.focus();

    const temp_post = localStorage.getItem('temp_post');
    if (temp_post !== undefined) {
      this.editor.setValue(temp_post);
    }

    /*    this.editor.setValue('\n\n' + '## 回复可见的是\n' +
          '>引用\n\n* 元\--啦啦--n\n**哇呕**\n```javascript\nfunction(){\nalert("yuan");\n}\n' +
          'module.exports = require(\'./lib/marked\');\n' +
          'import "com.android.utils.*"' + '\n' +
          '```\n' + '$$E=mc^2$$');*/
    // this.editor.setValue('1111$$E=mc^2$$');

    this.editor.on('change', (e, obj) => {
      this.updateAsync();
    });

    setTimeout(() => {
      this.updateAsync();
    }, 0);
  }

  moeMarkInit() {
    this.moeMark = MoeMark.setOptions({
      math: true,
      lineNumber: true,
      breaks: false,
      highlight: MoeditorHighlight,
      umlchart: true,
      umlRenderer: MoeditorUMLRenderer
    });
  }


  private updateAsync() {
    this.updatePreview = false;
    this.updatePreviewRunning = false;

    const content = this.editor.getValue();

    localStorage.setItem('temp_post', content);

    if (this.mdContent === content && !this.force) {
      this.updatePreviewRunning = false;
      if (this.updatePreview) {
        setTimeout(this.updateAsync());
      }
      this.updateComplete();
      return;
    }


    if (this.mdContent !== content) {
      this.mdContent = content;
      this.changed = true;
    }

    let mathCnt = 0, mathID = 0, rendered = null;
    const math = [];
    const rendering = true;

    this.moeMark(content, {
      mathRenderer: (str, display) => {
        const res = MoeditorMathRender.tryRender(str, display);
        if (res !== undefined) {
          return res;
        } else {
          mathCnt++;
          mathID++;
          const id = 'math-' + mathID;
          const r = '<span id="' + id + '"></span>';
          math[id] = {s: str, display: display};
          return r;
        }
      }
    }, (err, val) => {
      rendered = document.createElement('span');
      rendered.innerHTML = val;

      MoeditorMathRender.renderMany(math, (m) => {

        for (const id of Object.keys(m)) {
          rendered.querySelector('#' + id).innerHTML = m[id].res;
        }

        // 不支持图片路径
        /*        const imgs = rendered.querySelectorAll('img') || [];
                imgs.forEach((img) => {
                  let src = img.getAttribute('src');
                  if (url.parse(src).protocol === null) {
                    if (!path.isAbsolute(src)) {
                      src = path.resolve('', src);
                    }
                    src = url.resolve('file://', src);
                  }
                  img.setAttribute('src', src);
                });*/

        const set = new Set();
        const lineNumbers = rendered.querySelectorAll('moemark-linenumber') || [];
        lineNumbers.forEach((elem) => {
          set.add(parseInt(elem.getAttribute('i'), 10));
        });

        this.lineNumbers = (Array.from(set)).sort((a, b) => {
          return a - b;
        });

        this.scrollMap = undefined;
        document.getElementById('pre-container').innerHTML = rendered.innerHTML;
        SVGFixer(document.getElementById('pre-container'));

        this.updateComplete();
        this.updatePreviewRunning = false;
        if (this.updatePreview) {
          setTimeout(this.updateAsync(), 0);
        }

      });
    });
  }

  private updateComplete() {
    // fuck
  }


}
