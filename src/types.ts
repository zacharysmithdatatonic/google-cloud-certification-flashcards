export interface Question {
    id: string;
    question: string;
    options: string[];
    answer: string;
    explanation: string;
}

export interface QuestionPerformance {
    questionId: string;
    correctCount: number;
    incorrectCount: number;
    lastAnswered: Date | null;
    lastCorrect: boolean | null;
    scheduledNext: number | null; // For spaced repetition
}

export type StudyMode =
    | 'flashcard'
    | 'quiz'
    | 'review'
    | 'memorise'
    | 'fill-in-blank';

export interface AppState {
    questions: Question[];
    performance: Map<string, QuestionPerformance>;
    currentMode: StudyMode;
    currentQuestions: Question[];
    currentIndex: number;
    showAnswer: boolean;
    isLoading: boolean;
}

export interface StudySession {
    mode: StudyMode;
    questions: Question[];
    currentIndex: number;
    completed: boolean;
}

// Certification tiers
export type CertificationTier = 'foundational' | 'associate' | 'professional';

// Question bank configuration
export interface QuestionBank {
    key: string;
    name: string;
    shortName: string;
    tier: CertificationTier;
    dataset: string | null; // null means unavailable
    available: boolean;
    color: string; // Google color for the certification
}

// All Google Cloud certifications organized by tier
export const CERTIFICATION_TIERS: Record<
    CertificationTier,
    { name: string; color: string; description: string }
> = {
    foundational: {
        name: 'Foundational',
        color: '#34A853', // Google Green
        description:
            'Validates broad knowledge of cloud concepts and Google Cloud products, services, and tools.',
    },
    associate: {
        name: 'Associate',
        color: '#FBBC05', // Google Yellow
        description:
            'Validates fundamental skills to deploy and maintain cloud projects.',
    },
    professional: {
        name: 'Professional',
        color: '#4285F4', // Google Blue
        description:
            'Validates advanced skills in design, implementation, and management.',
    },
};

export const QUESTION_BANKS: QuestionBank[] = [
    // Foundational
    {
        key: 'cdl',
        name: 'Cloud Digital Leader',
        shortName: 'CDL',
        tier: 'foundational',
        dataset: null,
        available: false,
        color: '#34A853',
    },
    {
        key: 'genai',
        name: 'Generative AI Leader',
        shortName: 'GenAI',
        tier: 'foundational',
        dataset: '/genai.json',
        available: true,
        color: '#34A853',
    },
    // Associate
    {
        key: 'ace',
        name: 'Cloud Engineer',
        shortName: 'ACE',
        tier: 'associate',
        dataset: null,
        available: false,
        color: '#FBBC05',
    },
    {
        key: 'adp',
        name: 'Data Practitioner',
        shortName: 'ADP',
        tier: 'associate',
        dataset: null,
        available: false,
        color: '#FBBC05',
    },
    {
        key: 'agwa',
        name: 'Google Workspace Administrator',
        shortName: 'AGWA',
        tier: 'associate',
        dataset: null,
        available: false,
        color: '#FBBC05',
    },
    // Professional
    {
        key: 'pca',
        name: 'Cloud Architect',
        shortName: 'PCA',
        tier: 'professional',
        dataset: null,
        available: false,
        color: '#4285F4',
    },
    {
        key: 'pcde',
        name: 'Cloud Database Engineer',
        shortName: 'PCDE',
        tier: 'professional',
        dataset: null,
        available: false,
        color: '#4285F4',
    },
    {
        key: 'pcd',
        name: 'Cloud Developer',
        shortName: 'PCD',
        tier: 'professional',
        dataset: null,
        available: false,
        color: '#4285F4',
    },
    {
        key: 'pde',
        name: 'Data Engineer',
        shortName: 'PDE',
        tier: 'professional',
        dataset: '/pde.json',
        available: true,
        color: '#4285F4',
    },
    {
        key: 'pcdo',
        name: 'Cloud DevOps Engineer',
        shortName: 'PCDO',
        tier: 'professional',
        dataset: null,
        available: false,
        color: '#4285F4',
    },
    {
        key: 'pcse',
        name: 'Cloud Security Engineer',
        shortName: 'PCSE',
        tier: 'professional',
        dataset: null,
        available: false,
        color: '#4285F4',
    },
    {
        key: 'pcne',
        name: 'Cloud Network Engineer',
        shortName: 'PCNE',
        tier: 'professional',
        dataset: null,
        available: false,
        color: '#4285F4',
    },
    {
        key: 'pmle',
        name: 'Machine Learning Engineer',
        shortName: 'PMLE',
        tier: 'professional',
        dataset: '/pmle.json',
        available: true,
        color: '#4285F4',
    },
    {
        key: 'psoe',
        name: 'Security Operations Engineer',
        shortName: 'PSOE',
        tier: 'professional',
        dataset: null,
        available: false,
        color: '#4285F4',
    },
];
