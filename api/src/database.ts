import { SupabaseClient, 
    createClient } from "@supabase/supabase-js";
import { Database } from "generated.js";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { Document } from "langchain/document";
import { ArxivPaperNote } from "prompts.js";

export class SupabaseDatabase {
    vectorStore: SupabaseVectorStore;

    client: SupabaseClient<Database, 'public', any>;

    constructor(
        client: SupabaseClient<Database, 'public', any>, 
        vectorStore: SupabaseVectorStore
    ) {
        this.vectorStore = vectorStore;
        this.client = client;
    }
    
    static async fromDocuments(
        documents: Array<Document>
    ): Promise<SupabaseDatabase> {
        const privateKey = process.env.SUPABASE_PRIVATE_KEY;
        const supabaseUrl = process.env.SUPABASE_URL;
        if (!privateKey || !supabaseUrl) {
            throw new Error("Missing Supabase credentials");
        }

        const supabase = createClient<Database>(supabaseUrl, privateKey);

        // const { data, error } = await supabase
        //     .from('arxiv_embeddings')
        //     .select('*');

        // if (error) {
        //     throw error;
        // }

        // console.log(data);

        const vectorStore = await SupabaseVectorStore.fromDocuments(
            documents,
            new OpenAIEmbeddings(),
            {
                client: supabase,
                tableName: 'arxiv_embeddings',
                queryName: 'match_documents',
            }
        );

    return new this(supabase, vectorStore);
    }

    async addPaper({
        paperUrl,
        name,
        paper,
        notes
    }: {
        paperUrl: string;
        name: string;
        paper: string;
        notes: ArxivPaperNote[];
    }) {
        const { data, error } = await this.client
            .from('arxiv-papers')
            .insert(
                {
                arxiv_url: paperUrl,
                name,
                paper,
                notes
            },
        )
        .select();
        if (error) {
            throw error;
        }
        console.log(data);
    }
};