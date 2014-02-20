var through = require('through')
  , marked = require('marked')

/*
 * turn the meetup {data: filedata, entry: entry} data into metadata
 * about the meetups.
 */
function toMetadata() {
  var stream = through(write)

  return stream

  function write(data) {

    var lexed = marked.lexer(data.data)
      , plural = {
            'urls': true
          , 'organizers': true
        }
      , formats = []
      , format
      , meta = {}

    function parseTable(obj) {
      return [obj.header].concat(obj.cells).reduce(function(lhs, rhs) {
        var key = slugify(rhs[0].slice(2, -3))

        lhs[key] = plural[key] ? rhs[1].split(/,\s*/) : rhs[1]
        
        return lhs
      }, {})
    }

    meta.name = lexed[0].text
    meta.avatar = lexed[1].text

    var list = []
      , lastKey
      , listing

    for(var i = 2; i < lexed.length; i++) {
      var obj = lexed[i]

      if (obj.type === 'list_start') {
        listing = true;
      }

      if (obj.type === 'list_end') {
        meta[lastKey] = list
        list = []
        listing = false
      }

      if (listing && obj.type === 'text') {
        list.push(obj.text)
      }

      if (obj.type === 'table') {
        if (lastKey !== undefined) {
          meta[lastKey] = parseTable(obj)
        } else {
          meta.attributes = parseTable(obj)
        }
      }

      if (obj.type === 'heading') {
        lastKey = obj.text
        meta[lastKey] = {}
      }

      if (obj.type === 'paragraph') {
        meta[lastKey].body = obj.text
      }
    }

    meta.process = lexed.map(function(xs) {
      return xs.text || ''
    }).join('\n')

    stream.queue(meta)
  }
}

// TODO(dj): get rid of this prolly
// simple in this case:
function slugify(input) {
  input = input.toString()

  return input
    .replace(/[^\w\s\d\-]/g, '')
    .replace(/^\s*/, '')
    .replace(/\s*$/, '')
    .replace(/[\-\s]+/g, '-')
    .toLowerCase()
}

module.exports = toMetadata
