var test      = require('tape')
  , mkdToJson = require('../index.js')


test('JSON formatting', function(t) {
  mkdToJson().on('data' ,function(data) {
    if (data) {
      console.log('data', data);
      t.assert(data.name.length > 1)
    }
  })
})
