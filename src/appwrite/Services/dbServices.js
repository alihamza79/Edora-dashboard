import { collections } from "../collections";
import { databaseId, databases } from "../config";
import { ID } from "appwrite";
import storageServices from "./storageServices";

const db = {};

// Process collections as an object of key-value pairs
Object.entries(collections).forEach(([name, collectionId]) => {
  db[name] = {
    create: async (payload, documentId = ID.unique()) =>
      await databases.createDocument(databaseId, collectionId, documentId, payload),

    update: async (documentId, payload) =>
      await databases.updateDocument(databaseId, collectionId, documentId, payload),

    get: async (documentId) => await databases.getDocument(databaseId, collectionId, documentId),

    list: async (queries) =>
      await databases.listDocuments(databaseId, collectionId, queries),

    delete: async (documentId) =>
      await databases.deleteDocument(databaseId, collectionId, documentId),
  };
});

export default db;
