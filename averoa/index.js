const env = require('./env.js');
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const passport = require('passport')
const apiRoute = require('./../routes/api.js')
const webRoute = require('./../routes/web.js')
const { Model } = require('objection');
const DB = require('./../utility/DB.js')
const cors = require('./cors');
const morgan = require('./morgan');
const { engine } = require('./edge-js');
const path = require('path')
const port = process.env.APP_PORT
const { ApolloServer } = require("apollo-server-express")
const { ApolloServerPluginLandingPageGraphQLPlayground } = require("apollo-server-core")
const typeDefs = require("./graphql/typedef")
const resolvers = require("./graphql/resolver")

morgan(app);

// app.use(cors)
app.use(passport.initialize())

require('./../config/passport');
Model.knex(DB);

app.use(engine);
app.set('views', './../views');

app.use("/public", express.static(path.join(__dirname, '/../public')));

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/api', apiRoute)
app.use('/', webRoute)

// 

async function startApollo() {
  const server = new ApolloServer({
    introspection: true,
    typeDefs,
    resolvers,
    formatError: error => {
      return error
    },
    context: ({ req, res }) => {
      return {
        req,
        res,
      }
    },
    plugins: [
      ApolloServerPluginLandingPageGraphQLPlayground(),
    ],
  })

  await server.start()
  server.applyMiddleware({ app, path: "/graphql" })
}

startApollo();

// 
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})