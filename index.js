import { ApolloServer, gql } from 'apollo-server';
import fetch from 'node-fetch';

const BASE_URL = 'https://api-colombia.com/api/v1';

// se definen los tipos de datos para GraphQL
const typeDefs = gql`
  type City {
    id: ID
    name: String
    description: String
    surface: Float
    population: Int
    postalCode: String
  }

  type Department {
    id: ID
    name: String
    description: String
    municipalities: Int
    surface: Float
    population: Int
    phonePrefix: String
    cityCapital: City
  }

  type ConstitutionArticle {
    id: ID
    titleNumber: Int
    title: String
    chapterNumber: Int
    chapter: String
    articleNumber: Int
    content: String
  }

  type Region {
    id: ID
    name: String
    description: String
  }
  
  type President {
    id: ID
    name: String
    lastName: String
    startPeriodDate: String
    endPeriodDate: String
    politicalParty: String
    description: String
    cityId: ID
    
  }
  type Holiday {
    date: String
    name: String
  }  

  type Query {
    departments: [Department!]!
    presidents: [President!]!
    regions: [Region!]!
    constitutionArticles: [ConstitutionArticle!]!
    holidays(year: Int!): [Holiday!]!
  }
`;

// se definen los resolvers para cada consulta, utilizando fetch para obtener los datos
const resolvers = {
  Query: {
    departments: async () => {
      const res = await fetch(`${BASE_URL}/Department`);
      if (!res.ok) return [];
      return res.json();
    },

    presidents: async (_, { id }) => {
      const res = await fetch(`${BASE_URL}/President`);
      if (!res.ok) return null;
      return res.json();
    },

    constitutionArticles: async () => {
      const res = await fetch(`${BASE_URL}/ConstitutionArticle`);
      if (!res.ok) return [];
      return res.json();
    },

    regions: async () => {
      const res = await fetch(`${BASE_URL}/Region`);
      if (!res.ok) return [];
      return res.json();
    },

    holidays: async (_, { year }) => {
      const res = await fetch(`${BASE_URL}/Holiday/year/${year}`);
      if (!res.ok) return [];
      return res.json();
    },
  },
};

// Create the Apollo Server instance
const server = new ApolloServer({ typeDefs, resolvers });

// Start the server
server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});