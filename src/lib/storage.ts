import prisma from './prisma';
import type { Document } from '@/types/document';

export interface Storage {
  getDocuments: (userEmail: string) => Promise<Document[]>;
  getDocument: (id: string) => Promise<Document | null>;
  saveDocument: (document: Document) => Promise<Document>;
  deleteDocument: (id: string) => Promise<void>;
  getUserByEmail: (email: string) => Promise<any>;
}

class PrismaStorage implements Storage {
  async getUserByEmail(email: string) {
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: { email }
      });
    }

    return user;
  }

  async getDocuments(userEmail: string): Promise<Document[]> {
    const user = await this.getUserByEmail(userEmail);
    return prisma.document.findMany({
      where: { userId: user.id },
      orderBy: { uploadedAt: 'desc' }
    });
  }

  async getDocument(id: string): Promise<Document | null> {
    return prisma.document.findUnique({
      where: { id }
    });
  }

  async saveDocument(document: Document): Promise<Document> {
    const user = await this.getUserByEmail(document.userId);
    
    return prisma.document.create({
      data: {
        type: document.type,
        name: document.name,
        content: document.content,
        metadata: document.metadata,
        userId: user.id,
      }
    });
  }

  async deleteDocument(id: string): Promise<void> {
    await prisma.document.delete({
      where: { id }
    });
  }
}

let storageInstance: Storage | null = null;

export function getStorage(): Storage {
  if (!storageInstance) {
    storageInstance = new PrismaStorage();
  }
  return storageInstance;
}