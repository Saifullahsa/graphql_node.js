import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

const typeDefs =`#graphql
type Flim{
    flim_id: ID!
    title: String!
    description: String!
    release_year: Int!
    rental_rate: Float!
}

type Query{
    flim:[Flim!]!
}
`
const resolvers ={
    Query: {
    flim: async ()=> {
        const {rows} = await pool.query(`SELECT * FROM film `);
        return rows;
    }
}
}

const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, { listen: { port: 4000 } });
console.log(`Server ready at ${url}`);