import type { PrismaClient } from '@prisma/client';

const createMockTable = () => ({
  findUnique: async () => null,
  findMany: async () => [],
  findFirst: async () => null,
  create: async (args: any) => ({ id: `mock-${Date.now()}`, ...(args?.data || {}) }),
  update: async (args: any) => ({ ...(args?.data || {}) }),
  upsert: async (args: any) => ({ id: `mock-${Date.now()}`, ...(args?.create || {}) }),
  delete: async () => ({}),
  count: async () => 0,
});

const mockPrisma = new Proxy({}, {
  get: () => createMockTable(),
});

function getPrismaClient() {
  if (typeof window !== 'undefined') {
    return mockPrisma;
  }

  try {
    const req = eval('require');
    const { PrismaClient } = req('@prisma/client');
    const globalForPrisma = global as unknown as { prisma: any };
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      });
    }
    return globalForPrisma.prisma;
  } catch (err) {
    return mockPrisma;
  }
}

export const prisma = (new Proxy({}, {
  get: (_target, prop) => {
    const client = getPrismaClient();
    return client[prop];
  },
}) as unknown) as PrismaClient;

export default prisma;
