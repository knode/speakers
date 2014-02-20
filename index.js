module.exports = main

var toMetadata = require('./lib/mk')
  , path = require('path')
  , fs = require('fs')

var through = require('through')
  , ls = require('ls-stream')

if(require.main === module) {
  main()
    .pipe(require('JSONStream').stringify())
    .pipe(process.stdout)
}

function main() {
  return ls(__dirname)
    .pipe(filter())
    .pipe(annotateContent())
    .pipe(toMetadata())
}

// only emit entries that look like meetup markdown files.
function filter() {
  var stream = through(write)

  return stream

  function write(entry) {
    if(!/^(.+)\-(.+)(\-(.+))?/g.test(entry.path.replace(__dirname))) {
      entry.ignore()

      return
    }

    if(entry.stat.isFile() && path.extname(entry.path) === '.md') {
      stream.queue(entry)
    }
  }
}

// staple the file contents onto the meetup markdown files.
function annotateContent() {
  var stream = through(write, end)
    , pending = 0
    , ended

  return stream

  function write(entry) {
    ++pending
    fs.readFile(entry.path, 'utf8', onread)

    function onread(err, data) {
      if(err) {
        return stream.emit('error', err)
      }

      stream.queue({
          entry: entry
        , data: data
      })
      --pending
      check()
    }
  }

  function end() {
    ended = true
    check()
  }

  function check() {
    if(ended && !pending) {
      stream.queue(null)
    }
  }
}
