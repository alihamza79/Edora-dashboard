import { Client, Account, Databases, Storage } from "appwrite";

// Access environment variables
const Endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

// Check if environment variables are properly loaded
if (!Endpoint || !projectID || !databaseId) {
  console.error('Appwrite configuration missing. Check your .env file.');
}

const client = new Client();

client
  .setEndpoint(Endpoint || '') // Provide empty string as fallback
  .setProject(projectID || ''); // Provide empty string as fallback

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export { databaseId, projectID };
