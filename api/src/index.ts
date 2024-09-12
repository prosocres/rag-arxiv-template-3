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
    await writeFile(`pdfs/document.json`, pdf, 'utf-8');
    console.log('after write')
    const loader = new UnstructuredLoader(`pdfs/${randomName}.pdf`, {
        apiKey: process.env.UNSTRUCTURED_API_KEY,
        strategy: 'hi_res'
    })
    console.log('before load');
    const documents = await loader.load();
    console.log('after load');
    await unlink(`pdfs/${randomName}.pdf`);
    return documents;
}

// Convert PDF to JSON
// async function convertPdfToJSON(pdf: Buffer): Promise<Array<Document>> {
//     const pdfDoc = await PDFDocument.load(pdf);
//     const pages = pdfDoc.getPages();
//     const texts: string[] = [];
//     for (const page of pages) {
//         const content = await page.getTextContent();
//         const pageText = content.items.map(item => item.str).join(' ');
//         texts.push(pageText);
//     }
//     const jsonContent = JSON.stringify(texts, null, 2);
//     await writeFile(`pdfs/document.json`, jsonContent, 'utf-8');
//     return texts;
// }



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
    paperUrl: string
    name: string
    pagesToDelete?: number[]
}) {
    if (!paperUrl.endsWith('pdf')) {
        throw new Error('Not a pdf');
    }
    let pdfAsBuffer = await loadPdfFromUrl(paperUrl);
    if (pagesToDelete && pagesToDelete.length > 0) {
        pdfAsBuffer = await deletePages(pdfAsBuffer, pagesToDelete);
    }
    
    const documents = await convertPdfToDocuments(pdfAsBuffer);
    console.log('Buffered PDF');
    // Call the function in the main function
    //const documents = await convertPdfToJSON(pdfAsBuffer);
    //console.log('Converted PDF to JSON');
    const docs = await readFile('pdfs/document.json', 'utf-8');
    const parsedDocs: Array<Document> = JSON.parse(docs);
    const notes = await generateNotes(parsedDocs);
    //const notes = await generateNotes(documents);
    const database = await SupabaseDatabase.fromDocuments(documents);   
    console.log('tableCreated');
    await database.addPaper({
        paperUrl,
        name,
        paper: formatDocumentsAsString(documents),
        notes
    });
    console.log('notes saved');
}
main({ paperUrl: 'https://arxiv.org/pdf/2305.15334.pdf', name: 'test' });