import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

const typeDefs = `#graphql
  type Film {
    film_id: ID!
    title: String!
    film_category: [Film_category!]!
  }

  type Film_category {
    film_id: ID!
    category_id: ID!
    category: Category!
  }

  type Category {
    category_id: ID!
    name: String!
  }

  type Query {
    films: [Film!]!
    film_categorys: [Film_category!]!
    categorys: [Category!]!
    filmsByCategory(category: String!): [Film!]!
  }
`;

const resolvers = {
  Query: {
    films: async () => {
      const { rows } = await pool.query("SELECT * FROM film");
      return rows;
    },
    film_categorys: async () => {
      const { rows } = await pool.query("SELECT * FROM film_category");
      return rows;
    },
    categorys: async () => {
      const { rows } = await pool.query("SELECT * FROM category");
      return rows;
    },
    filmsByCategory: async (_, { category }) => {
      const { rows: films } = await pool.query("SELECT * FROM film");
      const { rows: filmCategories } = await pool.query("SELECT * FROM film_category");
      const { rows: categories } = await pool.query("SELECT * FROM category");

      const cat = categories.find((c) => c.name === category);
      if (!cat) return [];

      const filmIds = filmCategories.filter((fc) => fc.category_id === cat.category_id)
        .map((fc) => fc.film_id);

      return films.filter((f) => filmIds.includes(f.film_id));
    },
  },

  Film: {
    film_category: async (film) => {
      const { rows } = await pool.query("SELECT * FROM film_category");
      return rows.filter((fc) => fc.film_id === film.film_id);
    },
  },

  Film_category: {
    category: async (fc) => {
      const { rows } = await pool.query("SELECT * FROM category");
      return rows.find((c) => c.category_id === fc.category_id);
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(` Server ready at ${url}`);
