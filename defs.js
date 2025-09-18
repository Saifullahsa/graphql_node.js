import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

let books = [
  { id: 1, title: "The Hobbit", author: "J.R.R. Tolkien" },
  { id: 2, title: "Harry Potter", author: "J.K. Rowling" },
  { id: 3, title: "The Pragmatic Programmer", author: "Andrew Hunt" },
];

let sales = [
  { id: 1, rs: "200", books_id: "1" },
  { id: 2, rs: "300", books_id: "3" },
  { id: 3, rs: "400", books_id: "2" },
];

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
    # Book mutations
    createBook(title: String!, author: String!): Book!
    updateBook(id: ID!, title: String, author: String): Book
    deleteBook(id: ID!): Boolean!

    # Sales mutations
    createSale(rs: String!, books_id: ID!): Sales!
    updateSale(id: ID!, rs: String, books_id: ID): Sales
    deleteSale(id: ID!): Boolean!
  }
`;

const resolvers = {
  Query: {
    books: () => books,
    book: (_, { id }) => books.find(b => String(b.id) === id),
    sales: () => sales,
    sale: (_, { id }) => sales.find(s => String(s.id) === id),
  },

  Book: {
    sales: (book) => sales.filter(s => String(s.books_id) === String(book.id)),
  },

  Mutation: {
    // ----- Book -----
    createBook: (_, { title, author }) => {
      const newBook = { id: books.length + 1, title, author };
      books.push(newBook);
      return newBook;
    },
    updateBook: (_, { id, title, author }) => {
      const book = books.find(b => String(b.id) === id);
      if (!book) return null;
      if (title !== undefined) book.title = title;
      if (author !== undefined) book.author = author;
      return book;
    },
    deleteBook: (_, { id }) => {
      const index = books.findIndex(b => String(b.id) === id);
      if (index === -1) return false;
      books.splice(index, 1);
      // also remove related sales if you like:
      sales = sales.filter(s => String(s.books_id) !== id);
      return true;
    },

    // ----- Sales -----
    createSale: (_, { rs, books_id }) => {
      const newSale = { id: sales.length + 1, rs, books_id };
      sales.push(newSale);
      return newSale;
    },
    updateSale: (_, { id, rs, books_id }) => {
      const sale = sales.find(s => String(s.id) === id);
      if (!sale) return null;
      if (rs !== undefined) sale.rs = rs;
      if (books_id !== undefined) sale.books_id = books_id;
      return sale;
    },
    deleteSale: (_, { id }) => {
      const index = sales.findIndex(s => String(s.id) === id);
      if (index === -1) return false;
      sales.splice(index, 1);
      return true;
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`Server ready at ${url}`);
