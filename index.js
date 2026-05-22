import { ApolloServer, gql } from 'apollo-server';
import fetch from 'node-fetch';

const BASE_URL = 'https://api-colombia.com/api/v1';

const universitiesByCity = {};

const typeDefs = gql`
  type University {
    id: ID!
    name: String!
    cityId: ID!
  }

  type City {
    id: ID
    name: String
    description: String
    surface: Float
    population: Int
    postalCode: String
    universities: [University!]!
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

  type AddUniversityPayload {
    success: Boolean!
    message: String!
    university: University
  }

  type Query {
    departments: [Department!]!
    presidents: [President!]!
    regions: [Region!]!
    constitutionArticles: [ConstitutionArticle!]!
    holidays(year: Int!): [Holiday!]!
  }

  type Mutation {
    addUniversity(cityId: ID!, name: String!): AddUniversityPayload!
  }
`;

const resolvers = {
  Query: {
    departments: async () => {
      const res = await fetch(`${BASE_URL}/Department`);
      if (!res.ok) return [];
      return res.json();
    },

    presidents: async () => {
      const res = await fetch(`${BASE_URL}/President`);
      if (!res.ok) return [];
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

  Department: {
    cityCapital: async (parent) => {
      if (!parent.capitalId && !parent.cityCapitalId) return null;
      const capitalId = parent.capitalId ?? parent.cityCapitalId;
      const res = await fetch(`${BASE_URL}/City/${capitalId}`);
      if (!res.ok) return null;
      return res.json();
    },
  },

  City: {
    universities: (parent) => {
      const cityId = String(parent.id);
      return universitiesByCity[cityId] ?? [];
    },
  },

  Mutation: {
    addUniversity: (_, { cityId, name }) => {
      const key = String(cityId);

      if (!name?.trim()) {
        return {
          success: false,
          message: 'El nombre de la universidad no puede estar vacío.',
          university: null,
        };
      }

      if (!universitiesByCity[key]) {
        universitiesByCity[key] = [];
      }

      const exists = universitiesByCity[key].some(
        (u) => u.name.toLowerCase() === name.trim().toLowerCase()
      );

      if (exists) {
        return {
          success: false,
          message: `Ya existe una universidad llamada "${name}" en la ciudad ${cityId}.`,
          university: null,
        };
      }

      const newUniversity = {
        id: `${key}-${Date.now()}`,
        name: name.trim(),
        cityId: key,
      };

      universitiesByCity[key].push(newUniversity);

      return {
        success: true,
        message: 'Universidad agregada correctamente.',
        university: newUniversity,
      };
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});