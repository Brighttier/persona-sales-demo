import * as functions from 'firebase-functions';
import { Storage } from '@google-cloud/storage';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { TextServiceClient } from '@google-cloud/text-embeddings'; // Import Vertex AI TextServiceClient
import path from 'path';

const storage = new Storage();
const documentaiClient = new DocumentProcessorServiceClient();
const textServiceClient = new TextServiceClient(); // Initialize Vertex AI TextServiceClient

const projectId = process.env.GCP_PROJECT || '';
const location = 'us'; // Specify the location of your processor and Vertex AI endpoint
const processorId = 'ce477c2c26f6cf38'; // Replace with your processor ID

// Function to generate embeddings using Vertex AI
async function generateEmbeddings(text: string): Promise<void> {
  console.log('Generating embeddings for extracted text using Vertex AI...');

  const model = 'text-embedding-005';
  const content = text;
  const document = { content };

  try {
    const [response] = await textServiceClient.embedText({
      model,
      document,
    });

    const embeddings = response.embeddings;

    if (embeddings && embeddings.length > 0) {
      const embeddingVector = embeddings[0].values; // Assuming you want the first embedding

      console.log('Embeddings generated successfully:', embeddingVector);

      // *** Implement your logic to save the embeddings ***
      // For example, save to Firestore:
      // import { Firestore } from '@google-cloud/firestore';
      // const firestore = new Firestore();
      // await firestore.collection('resumeEmbeddings').add({
      //   text: text,
      //   embedding: embeddingVector,
      //   timestamp: new Date(),
      // });

    } else {
      console.log('No embeddings generated.');
    }

  } catch (error) {
    console.error('Error generating embeddings with Vertex AI:', error);
    throw error; // Re-throw the error to indicate failure
  }
}

export const processResume = functions.storage.object().onFinalize(async (object) => {
  // ... (rest of your existing code)

  try {
    // ... (Document AI processing code)

    if (document && document.text) {
      const extractedText = document.text;

      // ... (Save extracted text to Cloud Storage)

      console.log(`Extracted text saved to gs://${fileBucket}/${outputFilePath}`);

      // Trigger the embedding generation process
      await generateEmbeddings(extractedText); // Call the updated function

      return null;

    } else {
      console.log('No text extracted from the document.');
      return null;
    }

  } catch (error) {
    console.error('Error processing document with Document AI:', error);
    return null;
  }
});
