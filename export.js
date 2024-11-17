require("dotenv").config();
const { Client, Databases, Query } = require("node-appwrite");
const fs = require("fs");

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

function logWithTimestamp(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

async function exportSingleCollection(databaseId, collectionId) {
  try {
    let allDocuments = [];
    let lastId = null;
    let hasMore = true;
    let totalDocuments = 0;
    let exportedDocuments = 0;
    const startTime = Date.now();

    // Dapatkan total dokumen
    const initialResponse = await databases.listDocuments(
      databaseId,
      collectionId,
      [Query.limit(1)]
    );
    totalDocuments = initialResponse.total;

    logWithTimestamp(`Waktu mulai: ${new Date(startTime).toISOString()}`);
    logWithTimestamp(`Total dokumen: ${totalDocuments}`);

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

      exportedDocuments += response.documents.length;
      const progress = ((exportedDocuments / totalDocuments) * 100).toFixed(2);
      const currentTime = Date.now();
      const elapsedTime = (currentTime - startTime) / 1000; // dalam detik
      logWithTimestamp(
        `Progress: ${progress}% (${exportedDocuments}/${totalDocuments}) - Waktu: ${elapsedTime.toFixed(
          2
        )} detik`
      );

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

    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000; // dalam detik
    logWithTimestamp(
      `Ekspor selesai. Data disimpan di ${collectionId}_export.json`
    );
    logWithTimestamp(`Waktu selesai: ${new Date(endTime).toISOString()}`);
    logWithTimestamp(`Total waktu ekspor: ${totalTime.toFixed(2)} detik`);
  } catch (error) {
    logWithTimestamp(`Terjadi kesalahan saat mengekspor: ${error.message}`);
  }
}

// Ambil argumen dari baris perintah
const [, , databaseId, collectionId] = process.argv;

if (!databaseId || !collectionId) {
  logWithTimestamp("Penggunaan: node export.js [DATABASE_ID] [COLLECTION_ID]");
  process.exit(1);
}

// Jalankan fungsi dengan argumen yang diberikan
exportSingleCollection(databaseId, collectionId);
