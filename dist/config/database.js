"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
// Create a singleton instance of PrismaClient
const prisma = new client_1.PrismaClient();
// Handle connection errors
prisma.$on('error', (e) => {
    console.error('Prisma Client error:', e);
});
// Handle connection events
prisma.$on('beforeExit', () => {
    console.log('Prisma Client is shutting down');
});
// Export the prisma client instance
exports.default = prisma;
