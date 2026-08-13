// TypeScript declarations for firebase service

export interface Book {
    title: string;
    author: string;
    coverPath?: string;
    detail?: string;
}

export declare function login(email: string, password: string): Promise<any>;

export declare function getUserByUsername(username: string): Promise<any>;
export declare function addBookToShelf(shelf: string, book: Book): Promise<any>;
export declare function initFirebase(): void;
export declare function updateUserProfile(uid: string, data: any): Promise<void>;
export declare function changePassword(newPassword: string): Promise<void>;
