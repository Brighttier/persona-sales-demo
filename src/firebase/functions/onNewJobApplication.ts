import * as functions from 'firebase-functions';
import { Firestore } from '@google-cloud/firestore';
import { cosineSimilarity } from './utils'; // Import the utility function

const firestore = new Firestore();

export const onNewJobApplication = functions.firestore.document('jobApplications/{applicationId}')
  .onCreate(async (snapshot, context) => {
    const applicationData = snapshot.data();
    const applicationId = context.params.applicationId;

    const candidateId = applicationData.candidateId; // Assuming you store candidateId
    const jobId = applicationData.jobId;         // Assuming you store jobId

    if (!candidateId || !jobId) {
      console.error(`Missing candidateId or jobId for application ${applicationId}.`);
      return null;
    }

    try {
      // Fetch candidate embedding
      // Assuming candidateId is the document ID in resumeEmbeddings collection, or stored in a field
      const candidateEmbeddingSnapshot = await firestore.collection('resumeEmbeddings')
        .where('candidateId', '==', candidateId) // Adjust query if candidateId is not a field
        .limit(1)
        .get();

      if (candidateEmbeddingSnapshot.empty) {
        console.warn(`Resume embedding not found for candidateId: ${candidateId}. Cannot calculate match score for application ${applicationId}.`);
        await snapshot.ref.update({ matchScore: null, matchingStatus: 'no_resume_embedding' });
        return null;
      }

      const candidateEmbeddingData = candidateEmbeddingSnapshot.docs[0].data();
      const candidateEmbeddingVector = candidateEmbeddingData.embedding;

      if (!candidateEmbeddingVector) {
        console.warn(`Candidate embedding vector is missing for candidateId: ${candidateId}. Cannot calculate match score for application ${applicationId}.`);
         await snapshot.ref.update({ matchScore: null, matchingStatus: 'missing_candidate_vector' });
        return null;
      }

      // Fetch job description embedding
      // Assuming filePath in jobDescriptionEmbeddings is stored as job_descriptions/{jobId}.pdf
      const jobEmbeddingSnapshot = await firestore.collection('jobDescriptionEmbeddings')
        .where('filePath', '==', `job_descriptions/${jobId}.pdf`) // Adjust query if filePath is different
        .limit(1)
        .get();

      if (jobEmbeddingSnapshot.empty) {
        console.warn(`Job description embedding not found for jobId: ${jobId}. Cannot calculate match score for application ${applicationId}.`);
         await snapshot.ref.update({ matchScore: null, matchingStatus: 'no_job_embedding' });
        return null;
      }

      const jobEmbeddingData = jobEmbeddingSnapshot.docs[0].data();
      const jobEmbeddingVector = jobEmbeddingData.embedding;

      if (!jobEmbeddingVector) {
           console.warn(`Job embedding vector is missing for jobId: ${jobId}. Cannot calculate match score for application ${applicationId}.`);
            await snapshot.ref.update({ matchScore: null, matchingStatus: 'missing_job_vector' });
           return null;
      }

      // Calculate similarity
      const matchScore = cosineSimilarity(candidateEmbeddingVector, jobEmbeddingVector);

      // Update the application document with the score
      await snapshot.ref.update({
        matchScore: matchScore,
        matchingStatus: 'completed',
        matchedAt: new Date(),
      });

      console.log(`Match score calculated and saved for application ${applicationId}. Score: ${matchScore}`);

      return null;

    } catch (error) {
      console.error(`Error processing job application ${applicationId}:`, error);
       await snapshot.ref.update({ matchScore: null, matchingStatus: 'error' });
      return null;
    }
  });
