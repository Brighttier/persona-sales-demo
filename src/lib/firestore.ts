import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  type DocumentData,
  type QueryConstraint,
  serverTimestamp,
  onSnapshot,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';

// Generic Firestore utilities
export const firestoreUtils = {
  // Create a document
  async create<T extends DocumentData>(collectionName: string, data: T) {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  // Get a document by ID
  async getById<T extends DocumentData>(collectionName: string, id: string): Promise<T | null> {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  },

  // Get multiple documents with optional constraints
  async getMany<T extends DocumentData>(
    collectionName: string, 
    constraints: QueryConstraint[] = []
  ): Promise<T[]> {
    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];
  },

  // Update a document
  async update(collectionName: string, id: string, data: Partial<DocumentData>) {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  // Delete a document
  async delete(collectionName: string, id: string) {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  },

  // Subscribe to real-time updates
  subscribe<T extends DocumentData>(
    collectionName: string,
    callback: (data: T[]) => void,
    constraints: QueryConstraint[] = []
  ): Unsubscribe {
    const q = query(collection(db, collectionName), ...constraints);
    
    return onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      callback(data);
    });
  },

  // Subscribe to a single document
  subscribeToDoc<T extends DocumentData>(
    collectionName: string,
    id: string,
    callback: (data: T | null) => void
  ): Unsubscribe {
    const docRef = doc(db, collectionName, id);
    
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as T);
      } else {
        callback(null);
      }
    });
  }
};

// Job-specific operations
export interface Job {
  id?: string;
  title: string;
  description: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'remote';
  requirements: string[];
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  postedBy: string; // User ID
  status: 'draft' | 'active' | 'closed';
  applicantCount?: number;
  createdAt?: any;
  updatedAt?: any;
}

export const jobService = {
  async create(job: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'applicantCount'>) {
    return firestoreUtils.create<Job>('jobs', { ...job, applicantCount: 0 });
  },

  async getById(id: string) {
    return firestoreUtils.getById<Job>('jobs', id);
  },

  async getByUser(userId: string) {
    return firestoreUtils.getMany<Job>('jobs', [
      where('postedBy', '==', userId),
      orderBy('createdAt', 'desc')
    ]);
  },

  async getActive() {
    return firestoreUtils.getMany<Job>('jobs', [
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    ]);
  },

  async update(id: string, updates: Partial<Job>) {
    return firestoreUtils.update('jobs', id, updates);
  },

  async delete(id: string) {
    return firestoreUtils.delete('jobs', id);
  },

  subscribe(callback: (jobs: Job[]) => void) {
    return firestoreUtils.subscribe<Job>('jobs', callback, [
      orderBy('createdAt', 'desc')
    ]);
  }
};

// Job Application operations
export interface JobApplication {
  id?: string;
  jobId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  resumeUrl?: string;
  coverLetter?: string;
  status: 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired';
  matchScore?: number;
  matchingStatus?: 'pending' | 'completed' | 'no_resume_embedding' | 'missing_candidate_vector' | 'no_job_embedding' | 'missing_job_vector' | 'error';
  matchedAt?: any;
  appliedAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

export const applicationService = {
  async create(application: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt' | 'appliedAt'>) {
    return firestoreUtils.create<JobApplication>('jobApplications', { 
      ...application, 
      appliedAt: serverTimestamp(),
      status: 'pending'
    });
  },

  async getById(id: string) {
    return firestoreUtils.getById<JobApplication>('jobApplications', id);
  },

  async getByJob(jobId: string) {
    return firestoreUtils.getMany<JobApplication>('jobApplications', [
      where('jobId', '==', jobId),
      orderBy('appliedAt', 'desc')
    ]);
  },

  async getByCandidate(candidateId: string) {
    return firestoreUtils.getMany<JobApplication>('jobApplications', [
      where('candidateId', '==', candidateId),
      orderBy('appliedAt', 'desc')
    ]);
  },

  async update(id: string, updates: Partial<JobApplication>) {
    return firestoreUtils.update('jobApplications', id, updates);
  },

  async delete(id: string) {
    return firestoreUtils.delete('jobApplications', id);
  },

  subscribeToJob(jobId: string, callback: (applications: JobApplication[]) => void) {
    return firestoreUtils.subscribe<JobApplication>('jobApplications', callback, [
      where('jobId', '==', jobId),
      orderBy('appliedAt', 'desc')
    ]);
  }
};

// Interview operations
export interface Interview {
  id?: string;
  jobId: string;
  applicationId: string;
  candidateId: string;
  interviewerId: string;
  scheduledAt: any;
  duration: number; // in minutes
  type: 'video' | 'phone' | 'in-person' | 'ai';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  rating?: number; // 1-5
  feedback?: string;
  recordingUrl?: string;
  createdAt?: any;
  updatedAt?: any;
}

export const interviewService = {
  async create(interview: Omit<Interview, 'id' | 'createdAt' | 'updatedAt'>) {
    return firestoreUtils.create<Interview>('interviews', interview);
  },

  async getById(id: string) {
    return firestoreUtils.getById<Interview>('interviews', id);
  },

  async getByCandidate(candidateId: string) {
    return firestoreUtils.getMany<Interview>('interviews', [
      where('candidateId', '==', candidateId),
      orderBy('scheduledAt', 'desc')
    ]);
  },

  async getByInterviewer(interviewerId: string) {
    return firestoreUtils.getMany<Interview>('interviews', [
      where('interviewerId', '==', interviewerId),
      orderBy('scheduledAt', 'desc')
    ]);
  },

  async getByJob(jobId: string) {
    return firestoreUtils.getMany<Interview>('interviews', [
      where('jobId', '==', jobId),
      orderBy('scheduledAt', 'desc')
    ]);
  },

  async update(id: string, updates: Partial<Interview>) {
    return firestoreUtils.update('interviews', id, updates);
  },

  async delete(id: string) {
    return firestoreUtils.delete('interviews', id);
  }
};

// Export query helpers
export { where, orderBy, limit, serverTimestamp };