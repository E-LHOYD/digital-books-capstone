export interface Book {
    title: string;
    author: string;
    coverPath?: string;
    detail?: string;
    subject?: string;
    megaFileUrl?: string;
    id?: string;
}

export interface UserProfile {
    userId: string;
    email: string;
    yearLevel: string;
    course: string;
    createdAt: Date;
    lastUpdated: Date;
}
