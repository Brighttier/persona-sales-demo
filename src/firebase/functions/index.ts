import { onObjectFinalized } from 'firebase-functions/v2/storage';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { Storage } from '@google-cloud/storage';
import type { ObjectMetadata } from '@google-cloud/storage/build/cjs/src/storage'; // Attempting direct type import
import path from 'path';
import { Firestore } from '@google-cloud/firestore'; // Import Firestore
import { v4 as uuidv4 } from 'uuid'; // Import uuid

const storage = new Storage();
const documentaiClient = new DocumentProcessorServiceClient();
const firestore = new Firestore(); // Initialize Firestore

const projectId = process.env.GCP_PROJECT || '';
const location = 'us'; // Specify the location of your processor and Vertex AI endpoint
const processorId = 'ce477c2c26f6cf38'; // Replace with your processor ID
const jobDescriptionProcessorId = 'your-job-description-processor-id'; // Replace with your job description processor ID

// Function to generate embeddings using Vertex AI
async function generateEmbeddings(text: string, filePath: string, { dataType }: { dataType?: string } = {}): Promise<void> {
  console.log('Generating embeddings for extracted text using Vertex AI...');

  // *** Note: Vertex AI TextServiceClient import and initialization were removed due to errors.
  // You will need to add the correct import and initialization for Vertex AI Text Embeddings. ***

  // const model = 'text-embedding-005';
  // const content = text;

  // Commenting out the usage of textServiceClient until the correct Vertex AI setup is in place
  // try {
  //   const [response] = await textServiceClient.embedText({
  //     model,
  //     document: { content },
  //   });

  //   const embeddings = response.embeddings;

  //   if (embeddings && embeddings.length > 0) {
  //     const embeddingVector = embeddings[0].values; // Assuming you want the first embedding

  //     console.log('Embeddings generated successfully:', embeddingVector);

      // *** Implement your logic to save the embeddings to Firestore ***
      try {
        const collectionRef = firestore.collection(dataType === 'jobDescription' ? 'jobDescriptionEmbeddings' : 'resumeEmbeddings'); // Use different collection based on dataType
        await collectionRef.add({
          text: text,
          // embedding: embeddingVector, // Temporarily commented out
          filePath: filePath,\
          timestamp: new Date(),
          ...(dataType && { dataType }),
        });
        console.log('Embeddings and metadata saved to Firestore.');
      } catch (firestoreError) {
        console.error('Error saving embeddings to Firestore:', firestoreError);
        // Decide how to handle Firestore errors (e.g., re-throw, log and continue)
      }

  //   } else {
  //     console.log('No embeddings generated.');
  //   }

  // } catch (error) {
  //   console.error('Error generating embeddings with Vertex AI:', error);
  //   throw error; // Re-throw the error to indicate failure
  // }
}

export const processResume = onObjectFinalized(async (event) => {
  const object: ObjectMetadata | undefined = event.data;

  if (!object) {
    console.error('No object metadata found in the event.');
    return null;
  }

  const fileBucket = object.bucket;
  const filePath = object.name;
  const contentType = object.contentType;

  if (!filePath || filePath.endsWith('/') || !contentType || !contentType.startsWith('application/pdf')) {
    console.log('Not a supported file type or a directory. Exiting.');
    return null;
  }

  const watchPath = 'resumes/';
  if (!filePath.startsWith(watchPath)) {
    console.log('File is not in the watched path. Exiting.');
    return null;
  }

  const bucket = storage.bucket(fileBucket);
  const file = bucket.file(filePath);

  try {
    const [content] = await file.download();
    const name = `projects/${projectId}/locations/${location}/processors/${processorId}`; // Use processorId for resumes

    const request = {
      name,
      rawDocument: {
        content: content.toString('base64'),
        mimeType: contentType,
      },
    };

    const [result] = await documentaiClient.processDocument(request);
    const { document } = result;

    if (document && document.text) {
      const extractedText = document.text;

      const fileName = path.basename(filePath);
      const outputFileName = `${path.parse(fileName).name}.txt`;
      const outputFilePath = `parsed_resumes/${outputFileName}`;

      const outputFile = bucket.file(outputFilePath);
      await outputFile.save(extractedText);

      console.log(`Extracted text saved to gs://${fileBucket}/${outputFilePath}`);

      await generateEmbeddings(extractedText, filePath, { dataType: 'resume' });

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

export const processJobDescription = onObjectFinalized(async (event) => {
  const object: ObjectMetadata | undefined = event.data;

  if (!object) {
    console.error('No object metadata found in the event.');
    return null;
  }

  const fileBucket = object.bucket;
  const filePath = object.name;
  const contentType = object.contentType;

  if (!filePath || filePath.endsWith('/') || !contentType || !(contentType.startsWith('application/pdf') || contentType === 'text/plain'))) {
    console.log('Not a supported file type or a directory. Exiting.');
    return null;
  }

  const watchPath = 'job_descriptions/';
  if (!filePath.startsWith(watchPath)) {
    console.log('File is not in the watched path. Exiting.');
    return null;
  }

  const bucket = storage.bucket(fileBucket);
  const file = bucket.file(filePath);

  try {
    const [content] = await file.download();

    const name = `projects/${projectId}/locations/${location}/processors/${jobDescriptionProcessorId}`; // Use jobDescriptionProcessorId

    const request = {
      name,
      rawDocument: {
        content: content.toString('base64'),
        mimeType: contentType,
      },
    };

    const [result] = await documentaiClient.processDocument(request);
    const { document } = result;

    if (document && document.text) {
      const extractedText = document.text;

      const fileName = path.basename(filePath);
      const outputFileName = `${path.parse(fileName).name}_job_description.txt`;
      const outputFilePath = `processed_job_descriptions/${outputFileName}`;

      const jobDescriptionId = uuidv4(); // Generate a UUID

      const outputFile = bucket.file(outputFilePath);
      // Object metadata is not directly mutable after creation this way.
      // If you need to associate the UUID, save it alongside the file in Firestore
      // or a separate metadata file, linked by filePath or generated ID.
      // For now, commenting out setMetadata as it's likely incorrect usage.
      // await outputFile.setMetadata({ metadata: { jobId: jobDescriptionId } }); // Add UUID to metadata
      await outputFile.save(extractedText);

      console.log(`Extracted job description text saved to gs://${fileBucket}/${outputFilePath}`);

      await generateEmbeddings(extractedText, filePath, { dataType: 'jobDescription' });

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
