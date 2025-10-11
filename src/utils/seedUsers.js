import bcrypt from 'bcrypt';
import userRepository from '../repositories/UserRepository.js';
import roleRepository from '../repositories/RoleRepository.js';

export default async function seedUsers() {
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
    const existingAdmin = await userRepository.findByEmail(adminEmail);
    if (existingAdmin) return;

    let adminRole = await roleRepository.findByName('admin');
    if (!adminRole) {
        adminRole = await roleRepository.create({ name: 'admin' });
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '10', 10);
    const password = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin#123456';
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await userRepository.create({
        name: 'Admin',
        lastName: 'Principal',
        email: adminEmail,
        password: hashedPassword,
        phoneNumber: '999999999',
        birthdate: new Date('1990-01-01'),
        adress: 'Oficina central',

        url_profile: 'https://example.com/admin',
        roles: [adminRole._id]
    });

    
    console.log(`Seeded admin user (${adminEmail}). Default password configurable via DEFAULT_ADMIN_PASSWORD env var.`);
}