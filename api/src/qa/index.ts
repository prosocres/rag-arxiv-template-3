import { SupabaseDatabase } from "database.js";

async function qaOnPaper(question: string, paperUrl: string
) {
    const database = await SupabaseDatabase.fromExistingIndex();
    const documents =  await database.vectorStore.similaritySearch(question, 8, {
        url: paperUrl, 
    })
}