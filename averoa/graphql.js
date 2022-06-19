const ApolloServer  = require('apollo-server-express').ApolloServer;
const ApolloServerPluginDrainHttpServer = require('apollo-server-core').ApolloServerPluginDrainHttpServer;
const express = require('express');
const http = require('http');

async function startApolloServer(typeDefs, resolvers) {
	const app = express();
	const httpServer = http.createServer(app);
	const server = new ApolloServer({
	  typeDefs,
	  resolvers,
	  csrfPrevention: true,
	  cache: 'bounded',
	  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
	});
  
	await server.start();
	server.applyMiddleware({ app });
	await new Promise(resolve => httpServer.listen({ port: 4000 }, resolve));
	console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
  }

module.exports = startApolloServer;