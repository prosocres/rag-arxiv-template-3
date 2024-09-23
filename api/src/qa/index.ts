import { SupabaseDatabase } from "database.js";
import { ArxivPaperNote } from "notes/prompts.js";
import { Document } from "langchain/document";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { 
    ANSWER_QUESTION_TOOL_SCHEMA, 
    QA_OVER_PAPER_PROMPT, 
    answerOutputParser 
} from "./prompt.js";
import { formatDocumentsAsString } from "langchain/util/document";

async function qaModel(
    question: string,
    documents: Array<Document>,
    notes: Array<ArxivPaperNote>
) {
    const model = new ChatOpenAI({
        modelName: "gpt-4o-mini",
        temperature: 0.0
    });
    const modelWithTool = model.bind({
        tools: [ANSWER_QUESTION_TOOL_SCHEMA],
        tool_choice: 'auto',
    });
    const chain = 
        QA_OVER_PAPER_PROMPT.pipe(modelWithTool).pipe(answerOutputParser);
    const documentsAsString = formatDocumentsAsString(documents);
    const notesAsString = notes.map((note) => note.note).join("\n");
    const response = await chain.invoke({
        relevantDocuments: documentsAsString,
        notes: notesAsString,
        question
    });

    return response;
}

async function qaOnPaper(question: string, paperUrl: string
) {
    const database = await SupabaseDatabase.fromExistingIndex();
    const documents =  await database.vectorStore.similaritySearch(question, 8, {
        url: paperUrl, 
    });
    const { notes } = await database.getPaper(paperUrl);
    return qaModel(
        question,
        documents, 
        notes as unknown as Array<ArxivPaperNote>);
}