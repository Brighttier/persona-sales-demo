import * as functions from 'firebase-functions';
import { Storage } from '@google-cloud/storage';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { TextServiceClient } from '@google-cloud/text-embeddings'; // Import Vertex AI TextServiceClient
import path from 'path';
import { Firestore } from '@google-cloud/firestore'; // Import Firestoreimport { v4 as uuidv4 } from 'uuid'; // Import uuid

const storage = new Storage();
const documentaiClient = new DocumentProcessorServiceClient();
const textServiceClient = new TextServiceClient(); // Initialize Vertex AI TextServiceClient
const firestore = new Firestore(); // Initialize Firestore

const projectId = process.env.GCP_PROJECT || '';
const location = 'us'; // Specify the location of your processor and Vertex AI endpoint
const processorId = 'ce477c2c26f6cf38'; // Replace with your processor ID
const jobDescriptionProcessorId = 'your-job-description-processor-id'; // Replace with your job description processor ID

// Function to generate embeddings using Vertex AI
async function generateEmbeddings(text: string, filePath: string): Promise<void> { // Added filePath parameter
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

      // *** Implement your logic to save the embeddings to Firestore ***
      try {
        const collectionRef = firestore.collection('resumeEmbeddings'); // Replace 'resumeEmbeddings' with your desired collection name
        await collectionRef.add({
          text: text,
          embedding: embeddingVector,
          filePath: filePath, // Store the original file path
          timestamp: new Date(),
        });
        console.log('Embeddings and metadata saved to Firestore.');
      } catch (firestoreError) {
        console.error('Error saving embeddings to Firestore:', firestoreError);
        // Decide how to handle Firestore errors (e.g., re-throw, log and continue)
      }

    } else {
      console.log('No embeddings generated.');
    }

  } catch (error) {
    console.error('Error generating embeddings with Vertex AI:', error);
    throw error; // Re-throw the error to indicate failure
  }
}

export const processResume = functions.storage.object().onFinalize(async (object) => {
  const fileBucket = object.bucket; // The Storage bucket that contains the file.
  const filePath = object.name; // File path in the bucket.
  const contentType = object.contentType; // File content type.

  // Exit if this is a directory or not a supported file type
  if (!filePath || filePath.endsWith('/') || !contentType || !contentType.startsWith('application/pdf')) {
    console.log('Not a supported file type or a directory. Exiting.');
    return null;
  }

  // Specify the path to watch in Cloud Storage
  const watchPath = 'resumes/'; // Make sure this is correct
  if (!filePath.startsWith(watchPath)) {
    console.log('File is not in the watched path. Exiting.');
    return null;
  }

  const bucket = storage.bucket(fileBucket);
  const file = bucket.file(filePath);

  // Get the document content as a buffer
  const [content] = await file.download();

  // Construct the processor name
  const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;

  // Create the request for the Document AI API
  const request = {
    name,
    rawDocument: {
      content: content.toString('base64'),
      mimeType: contentType,
    },
  };

  try {
    // Process the document
    const [result] = await documentaiClient.processDocument(request);
    const { document } = result;

    if (document && document.text) {
      const extractedText = document.text;

      // Determine the output path for the extracted text
      const fileName = path.basename(filePath);
      const outputFileName = `${path.parse(fileName).name}.txt`;
      const outputFilePath = `parsed_resumes/${outputFileName}`; // Make sure this is correct

      // Save the extracted text to a new file in Cloud Storage
      const outputFile = bucket.file(outputFilePath);
      await outputFile.save(extractedText);

      console.log(`Extracted text saved to gs://${fileBucket}/${outputFilePath}`);

      // Trigger the embedding generation process and pass the original file path
      await generateEmbeddings(extractedText, filePath); // Pass filePath

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

// Cloud Function to process uploaded job descriptions
export const processJobDescription = functions.storage.object().onFinalize(async (object) => {
  const fileBucket = object.bucket;
  const filePath = object.name;
  const contentType = object.contentType;

  // Adjust supported file types for job descriptions if needed (e.g., '.txt', '.doc', '.docx')
  if (!filePath || filePath.endsWith('/') || !contentType || !(contentType.startsWith('application/pdf') || contentType === 'text/plain')) { // Added text/plain as an example
    console.log('Not a supported file type or a directory. Exiting.');
    return null;
  }

  const watchPath = 'job_descriptions/'; // Watch path for job descriptions (define your path)
  if (!filePath.startsWith(watchPath)) {
    console.log('File is not in the watched path. Exiting.');
    return null;
  }

  const bucket = storage.bucket(fileBucket);
  const file = bucket.file(filePath);

  const [content] = await file.download();

  // Use the appropriate processor ID for job descriptions
  const name = `projects/${projectId}/locations/${location}/processors/${jobDescriptionProcessorId}`;

  const request = {
    name,
    rawDocument: {
      content: content.toString('base64'),
      mimeType: contentType,
    },
  };

  try {
    const [result] = await documentaiClient.processDocument(request);
    const { document } = result;

    if (document && document.text) {
      const extractedText = document.text;

      // Determine the output path for the extracted text
      const fileName = path.basename(filePath);
      const outputFileName = `${path.parse(fileName).name}_job_description.txt`; // Differentiate output file name
      const outputFilePath = `processed_job_descriptions/${outputFileName}`; // Define output path for job descriptions

      const jobDescriptionId = uuidv4(); // Generate a UUID

      const outputFile = bucket.file(outputFilePath);
 await outputFile.setMetadata({ metadata: { jobId: jobDescriptionId } }); // Add UUID to metadata
      await outputFile.save(extractedText);

      console.log(`Extracted job description text saved to gs://${fileBucket}/${outputFilePath}`);

      await generateEmbeddings(extractedText, filePath, 'jobDescription'); // Call with dataType 'jobDescription'

      return null;

    } else {
      console.log('No text extracted from the job description document.');
      return null;
    }

  } catch (error) {
    console.error('Error processing job description document with Document AI:', error);
    return null;
  }
});