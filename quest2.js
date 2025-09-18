import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import pkg, { Query } from 'pg';
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
type Film{
    flim_id: ID!
    title: String!
    film_category: [Film_category!]!
}
type Film_category{
    flim_id: ID!
    category_id: ID!
    category:[Category!]!
}
type Category{
    category_id: ID!
    name:String!
}
type Query{
    films:[Film!]!
    film(id:ID!):Film

    film_categorys:[Film_category!]!
    film_category(id:ID!): Film_category

    categorys:[Category!]!
    category(id:ID!):Category
}
`
const resolvers ={
  Query:{
    films: async () =>{
        const {rows} = await pool.query(`SELECT * FROM film`);
        return rows
    },
    Film: {
        film_categorys:(film) => film_category.filter(f => String(f.film_id) === String(film.film_id))
    }
  }
}

const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, { listen: { port: 4000 } });
console.log(`Server ready at ${url}`);