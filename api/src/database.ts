import { SupabaseClient, 
    createClient } from "@supabase/supabase-js";
import { Database } from "generated.js";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { Document } from "langchain/document";
import { ArxivPaperNote } from "notes/prompts.js";




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
    
    static async fromExistingIndex(): Promise<SupabaseDatabase> {
        const privateKey = process.env.SUPABASE_PRIVATE_KEY;
        const supabaseUrl = process.env.SUPABASE_URL;
        if (!privateKey || !supabaseUrl) {
            throw new Error("Missing Supabase credentials");
        }

        console.log('Supabase credentials populated');

        const supabase = createClient<Database>(supabaseUrl, privateKey);

        const vectorStore = await SupabaseVectorStore.fromExistingIndex(
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
        notes,
    }: {
        paperUrl: string;
        name: string;
        paper: string;
        notes: ArxivPaperNote[];
    }) {
;       
        const { data, error } = await this.client
        .from('arxiv_papers')
        .insert({   
            arxiv_url: paperUrl,
            name,
            paper,
            notes,
        })
        .select()

        if(error) {
            throw new Error(error.message);
        }
    }

    async getPaper(
        url: string
    ): Promise<Database['public']['Tables']['arxiv_papers']['Row']> {
        const {data, error} = await this.client 
        .from('arxiv_papers')
        .select()
        .eq('arxiv_url', url);

        if (error || !data) {
            console.error("Error getting database");
            throw new Error(error.message);
        }
        return data[0];
    }

    async saveQa(
        question: string,
        answer: string,
        context: string,
        followupQuestions: string[]
    ) {
        const { data, error } = await this.client
        .from('arxiv_question_answering')
        .insert({
            question,
            answer,
            context,
            followup_questions: followupQuestions,
        });
        ;

        if (error) {
            throw new Error(error.message);
        }
    }

    async getPaperByURL(url: string) {
        const {data, error} = await this.client
            .from('arxiv_papers')
            .select()
            .eq('arxiv_url', url);
        if (error || !data) {
            console.error('Error getting data from database');
            throw error;
        }
    }
}