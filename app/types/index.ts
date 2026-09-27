export interface Book {
    title: string;
    author: string;
    coverPath?: string;
    coverUrl?: string;
    detail?: string;
    subject?: string;
    subjects?: string[];
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    id?: string;
    bookNumber?: string;
    publishedDate?: string;
    releaseDate?: string;
}

export interface UserProfile {
    userId: string;
    email: string;
    yearLevel: string;
    course: string;
    createdAt: Date;
    lastUpdated: Date;
}

export interface Shelf {
    id: string;
    name: string;
    userId: string;
    isReadShelf: boolean;
    createdAt: Date;
    bookIds: string[];
}

export interface UserShelves {
    userId: string;
    shelves: Shelf[];
    customShelfCount: number;
}
