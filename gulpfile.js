'use strict';
// generated on 2014-06-25 using generator-gulp-webapp 0.1.0

var gulp = require('gulp');

// @custom
var project = {
	name: 'dataviz-cub-pav',
	port: 9082,
	livereloadPort: 56438
};
var paths = {
    appDir: 'app',
    buildDir: 'dist',
    scripts: {
        dir: 'app/scripts',
        src:  'app/scripts/**/*.js',
        dest: 'dist/scripts'
    },
    styles: {
        dir: 'app/styles',
        src:  'app/styles/**/*.scss',
        dest: 'dist/styles'
    },
    images: {
        dir: 'app/images',
        src: 'app/images/**/*',
        dest: 'dist/images',
    },
    fonts: {
    		dir: null,
    		src: null,
    		dest: 'dist/fonts'
    }
};

// load plugins
var $ = require('gulp-load-plugins')();

gulp.task('styles', function () {
    return gulp.src('app/styles/main.scss')
        .pipe($.rubySass({
            style: 'expanded',
            precision: 10
        }))
        .pipe($.autoprefixer('last 1 version'))
        .pipe(gulp.dest('.tmp/styles'))
        .pipe($.size());
});

gulp.task('scripts', function () {
    return gulp.src(paths.scripts.dir+'/**/*.js')
        .pipe($.jshint())
        .pipe($.jshint.reporter(require('jshint-stylish')))
        .pipe($.size());
});

gulp.task('data', function () {
	require('gulp-util').log(paths.scripts.dir+'/*.json');
    return gulp.src(paths.scripts.dir+'/*.json')
        .pipe(gulp.dest(paths.scripts.dest))
        .pipe($.size());
});

gulp.task('html', ['styles', 'scripts'], function () {
    var jsFilter = $.filter('**/*.js');
    var cssFilter = $.filter('**/*.css');

    return gulp.src(paths.appDir+'/*.html')
        .pipe($.useref.assets({searchPath: '{.tmp,app}'}))
        .pipe(jsFilter)
        .pipe($.uglify())
        .pipe(jsFilter.restore())
        .pipe(cssFilter)
        .pipe($.csso())
        .pipe(cssFilter.restore())
        .pipe($.useref.restore())
        .pipe($.useref())
        .pipe(gulp.dest(paths.buildDir))
        .pipe($.size());
});

gulp.task('images', function () {
    return gulp.src(paths.images.dir+'/**/*')
        .pipe($.cache($.imagemin({
            optimizationLevel: 3,
            progressive: true,
            interlaced: true
        })))
        .pipe(gulp.dest('dist/images'))
        .pipe($.size());
});

gulp.task('fonts', function () {
    return $.bowerFiles()
        .pipe($.filter('**/*.{eot,svg,ttf,woff}'))
        .pipe($.flatten())
        .pipe(gulp.dest(paths.fonts.dest))
        .pipe($.size());
});

gulp.task('extras', ['data'], function () {
    return gulp.src(['app/*.*', '!app/*.html'], { dot: true })
        .pipe(gulp.dest(paths.buildDir));
});

gulp.task('clean', function () {
    return gulp.src(['.tmp', paths.buildDir], { read: false }).pipe($.clean());
});

gulp.task('build', ['html', 'images', 'fonts', 'extras']);

gulp.task('default', ['clean'], function () {
    gulp.start('build');
});

gulp.task('connect', function () {
    var connect = require('connect');
    var app = connect()
        .use(require('connect-livereload')({ port: project.livereloadPort }))
        .use(connect.static('app'))
        .use(connect.static('.tmp'))
        .use(connect.directory('app'));

    require('http').createServer(app)
        .listen(project.port)
        .on('listening', function () {
            console.log('Started connect web server on http://localhost:'+project.port);
        });
});

/*
* @custom: add dependencies
* 	* wiredep
*/
gulp.task('serve', ['wiredep', 'connect'], function () {
    require('opn')('http://localhost:'+project.port);
});

/*
	@custom: usemin
 */
gulp.task('usemin', function() {
	var usemin = require('gulp-usemin');
	var uglify = require('gulp-uglify');
	var minifyHtml = require('gulp-minify-html');
	var minifyCss = require('gulp-minify-css');
	var rev = require('gulp-rev');

  gulp.src('./*.html')
    .pipe(usemin({
      css: [minifyCss(), 'concat'],
      html: [minifyHtml({empty: true})],
      js: [uglify(), rev()]
    }))
    .pipe(gulp.dest('dist/'));
});

// inject bower components
gulp.task('wiredep', function () {
    var wiredep = require('wiredep').stream;

    gulp.src('app/styles/*.scss')
        .pipe(wiredep({
            directory: paths.appDir+'/bower_components'
        }))
        .pipe(gulp.dest('app/styles'));

    gulp.src(paths.appDir+'/*.html')
        .pipe(wiredep({
            directory: paths.appDir+'/bower_components'
            exclude: ['bootstrap-sass-official']
        }))
        .pipe(gulp.dest('app'));
});

gulp.task('watch', ['connect', 'serve'], function () {
    var server = $.livereload(project.livereloadPort);

    // watch for changes

    gulp.watch([
        paths.appDir+'/*.html',
        '.tmp/styles/**/*.css',
        paths.scripts.dir+'/**/*.js',
        paths.images.dir+'/**/*'
    ]).on('change', function (file) {
        server.changed(file.path);
    });

    gulp.watch(paths.styles.dir+'/**/*.scss', ['styles']);
    gulp.watch(paths.scripts.dir+'/**/*.js', ['scripts']);
    gulp.watch(paths.images.dir+'/**/*', ['images']);
    gulp.watch('bower.json', ['wiredep']);
});

// @custom
gulp.task('deploy', ['build'] , function() {
	var rsync = require('rsyncwrapper').rsync;
	var gutil = require('gulp-util');

	rsync({
		ssh: true,
		src: paths.buildDir+'/',
		dest: '/srv/edouard-lopez/demo/'+project.name,
		host: 'ed8@vm-ed',
		port: '822',
		recursive: true,
		syncDest: true,
		args: ['--verbose'],
		exclude: ['.git*','*.scss','node_modules'],
	}, function(error, stdout, stderr, cmd) {
		gutil.log(cmd);
		gutil.log(stdout);
		gutil.log(error);
		gutil.log(stderr);
	});
});
