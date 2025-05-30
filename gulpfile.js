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
import fs from 'fs/promises';
import Webpack_Config_Prod from './webpack.prod.js';
import Webpack_Config_Dev from './webpack.dev.js';
import ghpages from 'gh-pages';

const opus_file_template = 'src/template/md-item.htm';
const opus_folder_template = 'src/template/md-item.htm';

const pkg = {
  "name": "yunjiang.xin",
  "port": 9602,
  "host": "localhost",
  "htmlIndex": "index.html"
};
const STRAT_PAGE = "http://" + pkg.host + ":" + pkg.port + "/" + pkg.htmlIndex;

const Dist_Prod = 'build/' + pkg.name;
const Dist_Dev = 'build/dev';
var Dist = Dist_Dev;
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
    open: STRAT_PAGE,
  }));
}

function injectOpusFileContent(templateContent) {
  return through2.obj(async function (file, enc, cb) {
    const outputContent = templateContent.replace('<!-- @@content -->', file.contents.toString());
    file.contents = Buffer.from(outputContent);
    file.extname = '.html';
    cb(null, file);
  });
}

async function copy_opus() {
  const opusFileTemplateContent = await fs.readFile(opus_file_template, 'utf8');
  return src('src/opus/**/*.md')
    .pipe(markdown())
    .pipe(injectOpusFileContent(opusFileTemplateContent))
    .pipe(FileInclude({
      prefix: '<!--%',
      suffix: '%-->',
      basepath: '@root'
    }))
    .pipe(dest(Dist))
    .on('error', function (err) {
      console.error('Task:copy_md_opus,', err.message);
      this.end();
    });
}
async function generateIndex(dirPath) {
  try {
    const fsItems = await fs.readdir(dirPath, { withFileTypes: true });

    const directories = [];
    const files = [];
    const structure = {
      directories,
      files,
    };

    for (const item of fsItems) {
      if (item.isDirectory()) {
        const subDirJsonPath = path.join(item.parentPath, item.name, 'index.json');
        const subJsonStr = await readOrCreateFile(subDirJsonPath, '{}');
        const subDirJson = JSON.parse(subJsonStr);
        const name = subDirJson.name || item.name;
        const customPath = subDirJson.customPath || item.name + '/';
        const order = subDirJson.order || 1;
        directories.push({
          name,
          customPath,
          order,
        });
      } else if (item.isFile()) {
        if (item.name != "index.json") {
          files.push(item.name);
        }
      }
    }

    const indexPath = `${dirPath.replace(/\\/g, '/')}/index.json`;
    const existContent = await readOrCreateFile(indexPath, '{}');
    const contentObj = JSON.parse(existContent);
    contentObj.directories = structure.directories;
    contentObj.files = structure.files;
    const jsonContent = JSON.stringify(contentObj, null, 4);
    fs.writeFile(indexPath, jsonContent);
  } catch (err) {
    console.error(`Error generating index for ${dirPath}:`, err);
  }
}

async function readOrCreateFile(filePath, defaultContent = '') {
  try {
    // 尝试读取文件内容
    const content = await fs.readFile(filePath, 'utf8');
    return content;
  } catch (err) {
    if (err.code === 'ENOENT') {
      const dirPath = path.dirname(filePath);
      await fs.mkdir(dirPath, { recursive: true });
      await fs.writeFile(filePath, defaultContent, 'utf8');
      return defaultContent;
    } else {
      throw err;
    }
  }
}

export function make_opus_index() {
  return src('src/opus/**/', { read: false })
    .pipe(through2.obj(async function (file, enc, cb) {
      const dirPath = file.path;
      try {
        generateIndex(file.path);
        cb();
      } catch (err) {
        cb(err);
      }
    }));
}

function copy_html() {
  return src('src/view/**/*.html')
    .pipe(FileInclude({
      prefix: '<!--%',
      suffix: '%-->',
      basepath: '@file'
    })).on('error', function (err) {
      console.error('Task:copy-html,', err.message);
      this.end();
    }).pipe(dest(Dist));
}

function compile_js() {
  return src('src/js/main/**/*.js')
    .pipe(named(function (file) {
      let fileRelative = file.relative;
      let extNameStart = fileRelative.lastIndexOf(".");
      let relativePathAndStem = fileRelative.substring(0, extNameStart);
      return relativePathAndStem;
    }))
    .pipe(gulpWebpack({
      config: Webpack_Config
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
  return src('src/css/lib/**', { encoding: false }).pipe(dest(Dist + '/css/lib'));
}

export function copy_images() {
  return src('src/images/**', { encoding: false }).pipe(dest(Dist + '/images'));
}

export function copy_deploy() {
  return src('src/deploy/**', { encoding: false }).pipe(dest(Dist));
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

export const build = series(changeToProd, clean_task, copy_sources, copy_deploy, compile_js);

export const gh_deploy = (cb) => {
  ghpages.publish(Dist_Prod, (err) => {
    if (err) {
      console.error("gh_deploy error", err);
      return cb(err);
    }
    cb(null);
  });
};

export default start;
