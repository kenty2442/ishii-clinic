const {src, dest, watch, series, parallel} = require("gulp");

//scss
const sass = require("gulp-sass")(require("sass"));
const plumber = require("gulp-plumber"); // エラーが発生しても強制終了させない
const notify = require("gulp-notify"); // エラー発生時のアラート出力
const postcss = require("gulp-postcss"); // PostCSS利用
const cleanCSS = require("gulp-clean-css"); // 圧縮
const rename = require("gulp-rename"); // ファイル名変更
const sourcemaps = require("gulp-sourcemaps"); // ソースマップ作成
const mqpacker = require("css-mqpacker"); //メディアクエリをまとめる
const sassGlob = require("gulp-sass-glob-use-forward");

//画像圧縮
const imagemin = require("gulp-imagemin");
const imageminMozjpeg = require("imagemin-mozjpeg");
const imageminPngquant = require("imagemin-pngquant");
const imageminSvgo = require("imagemin-svgo");

//ファイル監視
const browserSync = require("browser-sync");

//postcss-cssnext ブラウザ対応条件 prefix 自動付与
const browsers = [
    "last 2 versions",
    "> 5%",
    "ie = 11",
    "not ie <= 10",
    "ios >= 8",
    "and_chr >= 5",
    "Android >= 5",
];

//参照元パス
const srcPath = {
    css: "src/scss/**/*.scss",
    html: "./**/*.html",
    img: "src/images/**/*",
};

//出力先パス
const destPath = {
    css: "assets/css/",
    html: "assets/html/",
    img: "assets/img/",
};

//sass
const cssSass = (done) => {
    return src(srcPath.css) //コンパイル元
        .pipe(sourcemaps.init()) //gulp-sourcemapsを初期化
        .pipe(
            plumber(
                //エラーが出ても処理を止めない
                {
                    errorHandler: notify.onError("Error:<%= error.message %>"),
                    //エラー出力設定
                }
            )
        )
        .pipe(sassGlob())
        .pipe(sass({outputStyle: "expanded"}))
        .pipe(postcss([mqpacker()])) // メディアクエリを圧縮
        .pipe(sourcemaps.write("/maps")) //ソースマップの出力
        .pipe(dest(destPath.css)) //コンパイル先
        .pipe(cleanCSS()) // CSS圧縮
        .pipe(
            rename({
                extname: ".min.css", //.min.cssの拡張子にする
            })
        )
        .pipe(dest(destPath.css)) // <- ここにも dest() が必要
        .on("end", done); // タスクの終了を通知
};

//画像圧縮（デフォルトの設定）
const imgImagemin = (done) => {
    return src(srcPath.img)
        .pipe(
            imagemin(
                [
                    imageminMozjpeg({
                        quality: 80,
                    }),
                    imageminPngquant(),
                    imageminSvgo(),
                ],
                {
                    verbose: true,
                }
            )
        )
        .pipe(dest(destPath.img))
        .on("end", done); // タスクの終了を通知
};

//ローカルサーバー立ち上げ、ファイル監視と自動リロード
const browserSyncFunc = (done) => {
    browserSync.init(browserSyncOption);
    done();
};

const browserSyncOption = {
    // proxy: "http://localhost/", //環境によって変更する
    reloadOnRestart: true,
    port: 8000,
    server: "./",
};

//リロード
const browserSyncReload = (done) => {
    browserSync.reload();
    done();
};

//ファイル監視
const watchFiles = () => {
    watch(srcPath.css, series(cssSass, browserSyncReload));
    watch(srcPath.html, series(browserSyncReload));
    watch(srcPath.img, series(imgImagemin, browserSyncReload));
};

exports.default = series(
    series(cssSass, imgImagemin),
    parallel(watchFiles, browserSyncFunc)
);
