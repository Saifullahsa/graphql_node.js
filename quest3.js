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
type Actor {
  actor_id: ID!
  first_name: String!
  last_name: String!
}

type FilmWithActors {
  filmTitle: String!
  actors: [Actor!]!
}

type Query {
  filmActors(filmId: ID!): FilmWithActors
}
`;

const resolvers = {
  Query: {
    filmActors: async (_, { filmId }) => {
      const { rows: films } = await pool.query("SELECT * FROM film");
      const { rows: filmActors } = await pool.query("SELECT * FROM film_actor");
      const { rows: actors } = await pool.query("SELECT * FROM actor");

      const film = films.find(f => String(f.film_id) === String(filmId));
      if (!film) return null;

      const actorIds = filmActors
        .filter(fa => String(fa.film_id) === String(filmId))
        .map(fa => fa.actor_id);

      const filmActorsList = actors.filter(a =>
        actorIds.includes(a.actor_id)
      );

      return {
        filmTitle: film.title,
        actors: filmActorsList,
      };
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, { listen: { port: 4000 } });
console.log(`Server ready at ${url}`);
