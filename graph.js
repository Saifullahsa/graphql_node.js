import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

let books = [
  { id: 1, title: "The Hobbit",        author: "J.R.R. Tolkien" },
  { id: 2, title: "Harry Potter",      author: "J.K. Rowling"   },
  { id: 3, title: "The Pragmatic Programmer", author: "Andrew Hunt" }
];

const sales =[
  {id: 1 , rs: "200" , books_id: "1"},
  {id: 2 , rs: "300" , books_id: "3"},
  {id: 3 , rs: "400" , books_id: "2"}
]

const typeDefs = `#graphql
  type Book {
    id: ID!
    title: String!
    author: String!
     sales:[Sales!]!
  }
  type Sales{
    id: ID!
    rs: String! 
  }

  type Query {
    books: [Book!]!
    book(id: ID!): Book
    sales:[Sales!]!
    sale(id: ID!):Sales
  }
  
   type Mutation{
    createBook(title: String!, author: String!):Book!
    updateBook(id:ID!, title: String ,author: String):Book
    deleteBook(id:ID!) :[Book]

    createSale(re: String!, books_id: String!): Sales!
    updateSale(id:ID!, re: String, books_id: String): Sales
    deleteSale(id:ID!):[Sales]
   }
`;

const resolvers = {
  Query: {
    books: () => books,
    book: (_, args) => books.find(b => String(b.id) === args.id),
    sales: ()=> sales,
    sale: (_,args) => sales.find(s => String(s.id) === args.id)
  },
   Book: {
    sales: (book) => sales.filter(s => String(s.books_id) === String(book.id)),
  },
  Mutation: {
    createBook(){
      
    },
     deleteBook(_,{id}){
      books = books.filter((g) => String(g.id)!== id)
       if (books === -1) return null; 
     },
     deleteSale(_,{id}){
      sales = sales.filter((g) => String(g.id) !== id)
     }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`Server ready at ${url}`);
