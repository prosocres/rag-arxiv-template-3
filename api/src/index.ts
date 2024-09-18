import axios from 'axios';
import { PDFDocument } from 'pdf-lib';
import { Document } from "langchain/document";
import { writeFile, 
    unlink, 
    readFile } from "fs/promises";
import { UnstructuredLoader } from 'langchain/document_loaders/fs/unstructured';
import { formatDocumentsAsString } from 'langchain/util/document';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { ArxivPaperNote, 
    NOTES_TOOL_SCHEMA, 
    NOTE_PROMPT, 
    outputParser } from 'prompts.js';
import { SupabaseDatabase } from 'database.js';

async function deletePages(
    pdf: Buffer, 
    pagesToDelete: number[]
): Promise<Buffer> {
    const pdfDoc = await PDFDocument.load(pdf);
    let numToOffsetBy = 1;
    for (const pageNum of pagesToDelete) {
        pdfDoc.removePage(pageNum - numToOffsetBy);
        numToOffsetBy++;
    }
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
}

async function loadPdfFromUrl(url: string): Promise<Buffer> {
    const response = await axios.get(url, {
        responseType: 'arraybuffer',
    })
    return response.data;
}

async function convertPdfToDocuments(pdf: Buffer): Promise<Array<Document>> {
    if (!process.env.UNSTRUCTURED_API_KEY) {
        throw new Error("Missing UNSTRUCTURED_API_KEY API key.")
    }
    const randomName = Math.random().toString(36).substring(7);
    await writeFile(`pdfs/${randomName}.pdf`, pdf, 'binary');
    const loader = new UnstructuredLoader(`pdfs/${randomName}.pdf`, {
        apiKey: process.env.UNSTRUCTURED_API_KEY,
        strategy: 'hi_res'
    })
    const documents = await loader.load();
    await writeFile(`pdfs/document.json`, JSON.stringify(documents), 'utf-8');
    await unlink(`pdfs/${randomName}.pdf`);
    return documents;
}

async function generateNotes(
    documents: Array<Document>
): Promise<Array<ArxivPaperNote>> {
    const documentsAsString = formatDocumentsAsString(documents);
    const model = new ChatOpenAI({
        modelName: "gpt-4o-mini",
        temperature: 0.0
    });
    const modelWithTool = model.bind({
        tools: [NOTES_TOOL_SCHEMA],
    });
    const chain = NOTE_PROMPT.pipe(modelWithTool).pipe(outputParser);
    const response = await chain.invoke({
        paper: documentsAsString,
    });
    return response;
}

async function main({
    paperUrl,
    name,
    pagesToDelete
}: {
    paperUrl: string;
    name: string;
    pagesToDelete?: number[];
}) {
    // if (!paperUrl.endsWith('pdf')) {
    //     throw new Error('Not a pdf');
    // }
    // let pdfAsBuffer = await loadPdfFromUrl(paperUrl);
    // if (pagesToDelete && pagesToDelete.length > 0) {
    //     pdfAsBuffer = await deletePages(pdfAsBuffer, pagesToDelete);
    // }
    // const documents = await convertPdfToDocuments(pdfAsBuffer);
    // console.log(documents);
    const docs = await readFile('pdfs/document.json', 'utf-8');
    const documents = JSON.parse(docs);
    const notes = await generateNotes(documents);
    const database = await SupabaseDatabase.fromDocuments(documents);   
    console.log('instantiated database');
    await database.addPaper({
        paperUrl,
        name,
        paper: formatDocumentsAsString(documents),
        notes,
    });
    console.log('notes saved');
}
main({ paperUrl: 'https://arxiv.org/pdf/2305.15334.pdf', name: 'test' });