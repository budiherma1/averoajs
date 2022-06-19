// const { join } from 'path')

// // CommonJS
// const { Edge } from 'edge.js')

// // Typescript import
// // import { Edge } from 'edge.js'

// const edge = new Edge({ cache: false })
// // edge.mount('views')
// edge.mount(join(__dirname, '/../views'))

// const View = async (res, view, data) => {
// 	return res.send(await edge.render(view,data));
// }
// export default View;

// const html = await edge.render('welcome', {
//   greeting: 'Hello world'
// })

'use strict';

import edge from 'edge.js';

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

export default engine;
