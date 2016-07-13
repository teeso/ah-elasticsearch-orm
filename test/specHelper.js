var os    = require('os');
var path  = require('path');
var async = require('async');
var exec  = require('child_process').exec;

exports.specHelper = {
  // testDir: '/tmp/ah-elasticsearch-orm',
  testDir: os.tmpDir() + '/ah-elasticsearch-orm',
  projectDir: path.normalize(__dirname + '/..'),

  doBash: function(commands, callback){
    if(!Array.isArray(commands)){ commands = [commands]; }
    var fullCommand = '/bin/bash -c \'' + commands.join(' && ') + '\'';
    console.log('>> ' + fullCommand);
    exec(fullCommand, function(error, data){
      callback(error, data);
    });
  },

  build: function(callback){
    var jobs = [];
    var packgeJSON = path.normalize(__dirname + '/../../bin/templates/package.json');
    var commands = [
      'rm -rf ' + this.testDir,
      'mkdir -p ' + this.testDir,
      'cd ' + this.testDir + ' && npm install actionhero',
      'cd ' + this.testDir + ' && ./node_modules/.bin/actionhero generate',
      'cd ' + this.testDir + ' && npm install',
      'rm -f ' + this.testDir + '/node_modules/ah-elasticsearch-orm',
      'ln -s ' + this.projectDir + ' ' + this.testDir + '/node_modules/ah-elasticsearch-orm',
      'cd ' + this.testDir + ' && npm run actionhero -- link --name ah-elasticsearch-orm',
      'mkdir -p ' + this.testDir + '/db/elasticsearch/indexes',
      'cp ' + this.projectDir + '/test/db/elasticsearch/indexes/people.js ' + this.testDir + '/db/elasticsearch/indexes/people.js',
    ];

    if(process.env.SKIP_BUILD !== 'true'){
      commands.forEach(function(cmd){
        jobs.push(function(done){ this.doBash(cmd, done); })
      });
    }

    async.series(jobs, callback);
  },

  start: function(callback){
    var self = this;
    var actionheroPrototype = require(self.testDir + '/node_modules/actionhero/actionhero.js').actionheroPrototype;
    self.actionhero = new actionheroPrototype();
    process.env.PROJECT_ROOT = self.testDir;
    self.actionhero.start(function(error, a){
      self.api = a;
      callback();
    });
  },

  stop: function(callback){
    var self = this;
    self.actionhero.stop(callback);
  },
};
