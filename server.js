import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";

dotenv.config();

import { ApolloServer } from "@apollo/server"; 
import { expressMiddleware } from "@apollo/server/express4"; 
import { makeExecutableSchema } from "@graphql-tools/schema";

import { PubSub } from "graphql-subscriptions";
import pkg from "pg";
const { Pool } = pkg;

import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws"; 

const PORT = process.env.PORT || 4000;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("Please set DATABASE_URL in .env");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const pubsub = new PubSub();
const MESSAGE_TOPIC = "MESSAGE_POSTED";

const typeDefs = `#graphql
type Message {
  id: ID!
  user: String!
  text: String!
  createdAt: String!
}

type Query {
  messages: [Message!]!
}

type Mutation {
  postMessage(user: String!, text: String!): Message!
}

type Subscription {
  messagePosted: Message!
}
`;

const resolvers = {
  Query: {
    messages: async () => {
      const res = await pool.query(
        `SELECT id, user_name AS user, text, created_at
         FROM messages ORDER BY created_at ASC`
      );
      return res.rows.map(r => ({
        id: r.id,
        user: r.user,
        text: r.text,
        createdAt: r.created_at.toISOString(),
      }));
    },
  },

  Mutation: {
    postMessage: async (_, { user, text }) => {
      const res = await pool.query(
        `INSERT INTO messages (user_name, text)
         VALUES ($1, $2)
         RETURNING id, user_name AS user, text, created_at`,
        [user, text]
      );
      const row = res.rows[0];
      const message = {
        id: row.id,
        user: row.user,
        text: row.text,
        createdAt: row.created_at.toISOString(),
      };
      await pubsub.publish(MESSAGE_TOPIC, { messagePosted: message });
      return message;
    },
  },

  Subscription: {
    messagePosted: {
      subscribe: () => pubsub.asyncIterableIterator(MESSAGE_TOPIC),
    },
  },
};

async function start() {
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const apolloServer = new ApolloServer({ schema });
  await apolloServer.start();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use(
  "/graphql",
  express.json(),         
  expressMiddleware(apolloServer, {
    context: async ({ req }) => ({ pool, pubsub }),
  })
);


  const httpServer = http.createServer(app);

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  const serverCleanup = useServer(
    { schema, context: async () => ({ pool, pubsub }) },
    wsServer
  );

  httpServer.listen(PORT, () => {
    console.log(`Server ready at http://localhost:${PORT}/graphql`);
    console.log(`Subscriptions ready at ws://localhost:${PORT}/graphql`);
  });

  const shutdown = async () => {
    await serverCleanup.dispose();
    await apolloServer.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch(err => {
  console.error("Server failed to start:", err);
});
