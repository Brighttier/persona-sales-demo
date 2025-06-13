import * as functions from 'firebase-functions';
import { Firestore } from '@google-cloud/firestore';
import { TextServiceClient } from '@google-cloud/aiplatform'.v1beta1;

const firestore = new Firestore();

// Function to calculate cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must be of the same length");
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0; // Avoid division by zero
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

export const matchCandidatesToJob = functions.https.onCall(async (data, context) => {
  // Optional: Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const { jobId, candidateIds } = data; // jobId is required, candidateIds is optional

  if (!jobId) {
    throw new functions.https.HttpsError('invalid-argument', 'The 'jobId' parameter is required.');
  }

  try {
    // 1. Fetch the job description embedding
    const jobEmbeddingSnapshot = await firestore.collection('jobDescriptionEmbeddings')
      .where('filePath', '==', `job_descriptions/${jobId}.pdf`) // Assuming filePath is stored this way
      .limit(1)
      .get();

    if (jobEmbeddingSnapshot.empty) {
      throw new functions.https.HttpsError('not-found', `Job description embedding not found for jobId: ${jobId}.`);
    }

    const jobEmbeddingData = jobEmbeddingSnapshot.docs[0].data();
    const jobEmbeddingVector = jobEmbeddingData.embedding;

    if (!jobEmbeddingVector) {
         throw new functions.https.HttpsError('internal', `Job embedding vector is missing for jobId: ${jobId}.`);
    }

    // 2. Fetch candidate embeddings
    let candidateEmbeddingsSnapshot;
    if (candidateIds && Array.isArray(candidateIds) && candidateIds.length > 0) {
      // Fetch specific candidates if IDs are provided
      // This assumes candidateId is stored somewhere in the resume embeddings document, e.g., as a field called 'candidateId'
      // If not, you might need a different query or structure.
       candidateEmbeddingsSnapshot = await firestore.collection('resumeEmbeddings')
        .where('candidateId', 'in', candidateIds)
        .get();

    } else {
      // Fetch all candidates if no specific IDs are provided
      candidateEmbeddingsSnapshot = await firestore.collection('resumeEmbeddings').get();
    }

    if (candidateEmbeddingsSnapshot.empty) {
      return { results: [] }; // No candidates to match
    }

    // 3. Calculate similarity and prepare results
    const results = candidateEmbeddingsSnapshot.docs.map(doc => {
      const candidateData = doc.data();
      const candidateEmbeddingVector = candidateData.embedding;

      if (!candidateEmbeddingVector) {
           console.warn(`Candidate embedding vector is missing for document ID: ${doc.id}. Skipping.`);
           return null; // Skip candidates without embeddings
      }

      const similarity = cosineSimilarity(jobEmbeddingVector, candidateEmbeddingVector);

      // You might want to return more candidate details here
      return {
        candidateId: doc.id, // Assuming the doc ID is the candidate identifier
        score: similarity,
        // Add other relevant candidate data you might need in the frontend
        // e.g., candidateName: candidateData.name,
      };
    }).filter(item => item !== null); // Remove null entries

    // Optional: Sort results by score in descending order
    results.sort((a, b) => b.score - a.score);

    return { results };

  } catch (error: any) {
    console.error('Error matching candidates to job:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error; // Re-throw HttpsError
    } else {
      throw new functions.https.HttpsError('internal', 'An error occurred while matching candidates.', error.message);
    }
  }
});
