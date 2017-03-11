module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    notify: {
      compiled: {
        options: {
          message: 'Everything compiled'
        }
      }
    },
    babel: {
      options: {
        sourceMap: true,
        presets: ['es2015', 'stage-0'],
        plugins: ['transform-runtime']
      },
      dist: {
        files: [{
          expand: true,
          cwd: 'src',
          src: ['**/*.js'],
          dest: 'lib/',
          ext: '.js'
        }]
      }
    },
    bump: {
      options: {
        pushTo: 'origin'
      }
    }
  });

  grunt.registerTask('default', ['babel', 'notify']);
};
