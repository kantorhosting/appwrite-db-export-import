require("dotenv").config();
const { Client, Databases, Query } = require("node-appwrite");
const fs = require("fs");

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function exportSingleCollection(databaseId, collectionId) {
  try {
    let allDocuments = [];
    let lastId = null;
    let hasMore = true;

    while (hasMore) {
      const queries = [Query.limit(100)];
      if (lastId) {
        queries.push(Query.cursorAfter(lastId));
      }

      const response = await databases.listDocuments(
        databaseId,
        collectionId,
        queries
      );
      allDocuments.push(...response.documents);

      if (response.documents.length < 100) {
        hasMore = false;
      } else {
        lastId = response.documents[response.documents.length - 1].$id;
      }
    }

    fs.writeFileSync(
      `${collectionId}_export.json`,
      JSON.stringify(allDocuments, null, 2)
    );
    console.log(`Ekspor selesai. Data disimpan di ${collectionId}_export.json`);
  } catch (error) {
    console.error("Terjadi kesalahan saat mengekspor:", error);
  }
}

// Ambil argumen dari baris perintah
const [, , databaseId, collectionId] = process.argv;

if (!databaseId || !collectionId) {
  console.error("Penggunaan: node export.js [DATABASE_ID] [COLLECTION_ID]");
  process.exit(1);
}

// Jalankan fungsi dengan argumen yang diberikan
exportSingleCollection(databaseId, collectionId);
