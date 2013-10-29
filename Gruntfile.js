module.exports = function (grunt) {
    var stripBanner = function (src, options) {

        if (!options) { options = {}; }
        var m = [];
        if (options.line) {
            // Strip // ... leading banners.
            m.push('(/{2,}[\\s\\S].*)');
        }
        if (options.block) {
            // Strips all /* ... */ block comment banners.
            m.push('(\/+\\*+[\\s\\S]*?\\*\\/+)');
        } else {
            // Strips only /* ... */ block comment banners, excluding /*! ... */.
            m.push('(\/+\\*+[^!][\\s\\S]*?\\*\\/+)');

        }
        var re = new RegExp('\s*(' + m.join('|') + ')\s*', 'g');
        src = src.replace(re, '');
        src = src.replace(/\s{2,}(\r|\n|\s){2,}$/gm, '');
        return src;
    };

    grunt.registerMultiTask('concat', 'Concatenate files.', function () {
        // Merge task-specific and/or target-specific options with these defaults.
        var options = this.options({
            separator: grunt.util.linefeed,
            banner: '',
            footer: '',
            stripBanners: false,
            process: false
        });
        // Normalize boolean options that accept options objects.
        if (typeof options.stripBanners === 'boolean' && options.stripBanners === true) { options.stripBanners = {}; }
        if (typeof options.process === 'boolean' && options.process === true) { options.process = {}; }

        // Process banner and footer.
        var banner = grunt.template.process(options.banner);
        var footer = grunt.template.process(options.footer);

        // Iterate over all src-dest file pairs.
        this.files.forEach(function (f) {
            // Concat banner + specified files + footer.
            var src = banner + f.src.filter(function (filepath) {
                // Warn on and remove invalid source files (if nonull was set).
                if (!grunt.file.exists(filepath)) {
                    grunt.log.warn('Source file "' + filepath + '" not found.');
                    return false;
                } else {
                    return true;
                }
            }).map(function (filepath) {
                    // Read file source.
                    var src = grunt.file.read(filepath);
                    // Process files as templates if requested.
                    if (options.process) {
                        src = grunt.template.process(src, options.process);
                    }
                    // Strip banners if requested.
                    if (options.stripBanners) {
                        src = stripBanner(src, options.stripBanners);
                    }
                    return src;
                }).join(grunt.util.normalizelf(options.separator)) + footer;

            // Write the destination file.
            grunt.file.write(f.dest, src);

            // Print a success message.
            grunt.log.writeln('File "' + f.dest + '" created.');
        });
    });

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        srcFiles: [
            "components/packery/js/rect.js",
            "components/packery/js/packer.js",
            "components/packery/js/item.js",
            "components/packery/js/packery.js"
        ],
        concat: {
            options: {
                banner: '/***********************************************\n' +
                    '* CCUI Packery JavaScript Library\n' +
                    '* Authors: https://github.com/torworx/ccui-foundation/blob/master/README.md \n' +
                    '* License: GPL v3\n' +
                    '* Compiled At: <%= grunt.template.today("yyyy-mm-dd HH:MM") %>\n' +
                    '***********************************************/\n'
            },
            prod: {
                options: {
                    stripBanners: {
                        block: true,
                        line: true
                    }
                },
                src: ['<%= srcFiles %>'],
                dest: '<%= pkg.name %>.js'
            }
        },
        uglify: {
            build: {
                src: '<%= pkg.name %>.js',
                dest: '<%= pkg.name %>.min.js'
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('build', ['concat', 'uglify']);

    grunt.registerTask('default', ['build']);
};