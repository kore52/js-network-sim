module.exports = function(grunt) {

  grunt.initConfig({
    jshint: {
      files: [
        'Gruntfile.js',
        'src/*.js',
        '*.js',
        '.jshintrc',
      ],
      options: {
        jshintrc: '.jshintrc',
      },
    },

    concat: {
      files: {
        src  : 'src/*.js',
        dest : 'output/js/network.js',
      },
    },

    uglify: {
      dist: {
        files: {
          'output/js/network-min.js': 'output/js/network.js',
        },
      },
    },

    watch: {
      js: {
        files: 'src/*.js',
        tasks: ['concat', 'uglify'],
      },
    },

    karma: {
      unit: {
        configFile: 'karma.conf.js',
      }
    },

    mocha_phantomjs: {
      all: ['tests/*.html']
    }
  })

  grunt.loadNpmTasks('grunt-contrib-concat')
  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.loadNpmTasks('grunt-contrib-watch')
  grunt.loadNpmTasks('grunt-contrib-jshint')
  grunt.loadNpmTasks('grunt-mocha-phantomjs')
  grunt.loadNpmTasks('grunt-karma')

  grunt.registerTask('default', ['watch'])
  grunt.registerTask('build', ['jshint'])
  grunt.registerTask('test', ['karma'])

}
