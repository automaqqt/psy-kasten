#!/usr/bin/env node
/**
 * Create an admin user or promote an existing user to admin.
 *
 * Usage:
 *   npm run create-admin
 *   node scripts/create-admin.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function ask(question) {
    return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
    console.log('\n--- psyKasten: Create Admin User ---\n');

    const email = (await ask('Email: ')).trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        console.error('Invalid email address.');
        process.exit(1);
    }

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
        if (existing.role === 'ADMIN') {
            console.log(`\n"${email}" is already an admin.`);
            process.exit(0);
        }
        const confirm = await ask(`User "${email}" exists as ${existing.role}. Promote to ADMIN? (y/N): `);
        if (confirm.toLowerCase() !== 'y') {
            console.log('Cancelled.');
            process.exit(0);
        }
        await prisma.user.update({
            where: { email },
            data: { role: 'ADMIN' },
        });
        console.log(`\nDone. "${email}" is now an admin.`);
    } else {
        const name = (await ask('Name (optional): ')).trim() || null;
        const password = (await ask('Password (min 8 chars): ')).trim();
        if (password.length < 8) {
            console.error('Password must be at least 8 characters.');
            process.exit(1);
        }

        const hash = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: {
                email,
                name,
                passwordHash: hash,
                role: 'ADMIN',
                emailVerified: new Date(),
            },
        });
        console.log(`\nDone. Admin user "${email}" created.`);
    }
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => { rl.close(); prisma.$disconnect(); });
