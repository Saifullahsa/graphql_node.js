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

const typeDefs = `#graphql
  type Book {
    id: ID!
    title: String!
    author: String!
    sales: [Sales!]!
  }
  type Sales {
    id: ID!
    rs: String!
    books_id: ID!
  }
  type Query {
    books: [Book!]!
    book(id: ID!): Book
    sales: [Sales!]!
    sale(id: ID!): Sales
  }
  type Mutation {
    createBook(title: String!, author: String!): Book!
    updateBook(id: ID!, title: String, author: String): Book
    deleteBook(id: ID!): Boolean

    createSale(rs: String!, books_id: ID!): Sales!
    updateSale(id: ID!, rs: String, books_id: ID): Sales
    deleteSale(id: ID!): Boolean
  }
`;

const resolvers = {
  Query: {
    books: async () => {
      const { rows } = await pool.query('SELECT * FROM books');
      return rows;
    },
    book: async (_, { id }) => {
      const { rows } = await pool.query('SELECT * FROM books WHERE id=$1', [id]);
      return rows[0] || null;
    },
    sales: async () => {
      const { rows } = await pool.query('SELECT * FROM sales');
      return rows;
    },
    sale: async (_, { id }) => {
      const { rows } = await pool.query('SELECT * FROM sales WHERE id=$1', [id]);
      return rows[0] || null;
    },
  },
  Book: {
    sales: async (book) => {
      const { rows } = await pool.query('SELECT * FROM sales WHERE books_id=$1', [book.id]);
      return rows;
    },
  },
  Mutation: {
    createBook: async (_, { title, author }) => {
      const { rows } = await pool.query(
        'INSERT INTO books (title, author) VALUES ($1, $2) RETURNING *',
        [title, author]
      );
      return rows[0];
    },
    updateBook: async (_, { id, title, author }) => {
      const { rows } = await pool.query(
        'UPDATE books SET title=COALESCE($2,title), author=COALESCE($3,author) WHERE id=$1 RETURNING *',
        [id, title, author]
      );
      return rows[0];
    },
    deleteBook: async (_, { id }) => {
      await pool.query('DELETE FROM books WHERE id=$1', [id]);
      return true;
    },

    createSale: async (_, { rs, books_id }) => {
      const { rows } = await pool.query(
        'INSERT INTO sales (rs, books_id) VALUES ($1, $2) RETURNING *',
        [rs, books_id]
      );
      return rows[0];
    },
    updateSale: async (_, { id, rs, books_id }) => {
      const { rows } = await pool.query(
        'UPDATE sales SET rs=COALESCE($2,rs), books_id=COALESCE($3,books_id) WHERE id=$1 RETURNING *',
        [id, rs, books_id]
      );
      return rows[0];
    },
    deleteSale: async (_, { id }) => {
      await pool.query('DELETE FROM sales WHERE id=$1', [id]);
      return true;
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, { listen: { port: 4000 } });
console.log(`Server ready at ${url}`);
