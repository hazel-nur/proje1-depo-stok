import { Prisma } from '../generated/prisma/client';

// Transaction içinde de, normal PrismaService ile de çalışan istemci tipi
export type DbClient = Prisma.TransactionClient;
