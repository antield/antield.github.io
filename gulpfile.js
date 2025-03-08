import markdown from 'gulp-markdown';
import { src, dest, watch, series, parallel } from 'gulp';
import cleanCSS from 'gulp-clean-css';
import FileInclude from 'gulp-file-include';
import WebServer from 'gulp-webserver';
import Clean from 'gulp-clean';
import webpack from 'webpack';
import gulpWebpack from 'webpack-stream';
import path from 'path';
import named from 'vinyl-named';
import through2 from 'through2';
import fs from 'fs';

const pkg = {
  "name": "antield.github.io",
  "port": 9602,
  "host": "localhost",
  "htmlIndex": "category.html"
};
const STRAT_PAGE = "http://" + pkg.host + ":" + pkg.port + "/" + pkg.htmlIndex;

const Dist_Prod = 'build/' + pkg.name;
const Dist_Dev = 'build/dev';
var Dist = Dist_Dev;
const Webpack_Config_Prod = './webpack.prod.js';
const Webpack_Config_Dev = './webpack.dev.js';
var Webpack_Config = Webpack_Config_Dev;

function watch_task(cb) {
  watch(['src/view/**/*.html', 'src/include/*'], copy_html);
  watch('src/js/compile-less/**', copy_js_compile_less);
  watch('src/js/lib/**', copy_js_lib);
  watch('src/css/*', copy_css);
  watch('src/css/lib/**', copy_css_lib);
  //watch('src/images/**', copy_images);
  watch(['src/js/main/**/*.js', 'src/js/module/*', 'src/js/part/*'], compile_js);
  cb();
}

function web_server() {
  return src(Dist).pipe(WebServer({
    port: pkg.port,
    host: pkg.host,
    livereload: true,
    open: STRAT_PAGE
  }));
}

// 自定义函数来注入内容到模板
function injectContent(templatePath) {
  return through2.obj(function (file, enc, cb) {
    // const fileName = file.stem; // 获取文件名（不带扩展名）
    const templateContent = fs.readFileSync(templatePath, 'utf8'); // 读取模板文件内容
    const outputContent = templateContent.replace('<!-- @@content -->', file.contents.toString()); // 替换模板中的占位符
    file.contents = Buffer.from(outputContent);
    file.extname = '.html';
    // console.log("file.path: " + file.path);
    cb(null, file);
  });
}

function copy_opus() {
  return src('src/opus/**/*.md')
    .pipe(markdown())
    .pipe(injectContent('src/template/md-item.htm'))
    .pipe(FileInclude({
      prefix: '<%',
      suffix: '%>',
      basepath: '@root'
    }))
    .pipe(dest(Dist))
    .on('error', function (err) {
      console.error('Task:copy_md_opus,', err.message);
      this.end();
    });
}

function copy_html() {
  return src('src/view/**/*.html')
    .pipe(FileInclude({
      prefix: '<%',
      suffix: '%>',
      basepath: '@file'
    })).on('error', function (err) {
      console.error('Task:copy-html,', err.message);
      this.end();
    }).pipe(dest(Dist));
}

async function compile_js() {
  return src('src/js/main/**/*.js')
    .pipe(named(function (file) {
      let fileRelative = file.relative;
      let extNameStart = fileRelative.lastIndexOf(".");
      let relativePathAndStem = fileRelative.substring(0, extNameStart);
      return relativePathAndStem;
    }))
    .pipe(gulpWebpack({
      config: await import(Webpack_Config)
    }, webpack))
    .pipe(dest(Dist + '/js'));
}

function copy_js_lib() {
  return src('src/js/lib/**').pipe(dest(Dist + '/js/lib'));
}

function copy_js_compile_less() {
  return src('src/js/compile-less/**').pipe(dest(Dist + '/js/compile-less'));
}

export function copy_css() {
  return src('src/css/*.css').pipe(cleanCSS()).pipe(dest(Dist + '/css'));
}

function copy_css_lib() {
  return src('src/css/lib/**').pipe(dest(Dist + '/css/lib'));
}

export function copy_images() {
  return src('src/images/**').pipe(dest(Dist + '/images'));
}

var copy_sources = parallel(copy_css, copy_css_lib, copy_js_lib, copy_js_compile_less, copy_html, copy_opus, copy_images);

export function clean_task() {
  return src(Dist, {
    allowEmpty: true
  }).pipe(Clean());
}

const start = series(clean_task, copy_sources, compile_js, web_server, watch_task);

function changeToProd(cb) {
  Dist = Dist_Prod;
  Webpack_Config = Webpack_Config_Prod;
  cb();
}

export const build = series(changeToProd, clean_task, copy_sources, compile_js);

export default start;
