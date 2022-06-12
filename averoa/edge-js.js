// const { join } = require('path')

// // CommonJS
// const { Edge } = require('edge.js')

// // Typescript import
// // import { Edge } from 'edge.js'

// const edge = new Edge({ cache: false })
// // edge.mount('views')
// edge.mount(join(__dirname, '/../views'))

// const View = async (res, view, data) => {
// 	return res.send(await edge.render(view,data));
// }
// module.exports = View;

// const html = await edge.render('welcome', {
//   greeting: 'Hello world'
// })

'use strict';

const edge = require('edge.js').default;

const engine = (req, res, next) => {
  /*
  |-------------------------------------------------------------------------------------------------
  | Override the app.render function so that we can use dot notation
  |-------------------------------------------------------------------------------------------------
  */

  const { render } = res;

  res.render = function _render(view, options, callback) {
    const self = this;

    render.call(self, view.replace(/\./gi, '/'), options, callback);
  };

  /*
  |-------------------------------------------------------------------------------------------------
  | Register the edge view engine
  |-------------------------------------------------------------------------------------------------
  */

  req.app.engine('edge', (filePath, options, callback) => {
    edge.mount(req.app.settings.views);

    edge.render(filePath, options)
      .then((content) => callback(null, content))
      .catch((err) => callback(err));
  });

  /*
  |-------------------------------------------------------------------------------------------------
  | Set the app view engine
  |-------------------------------------------------------------------------------------------------
  */

  req.app.set('view engine', 'edge');

  next();
};

module.exports = { engine };