import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userRepository from '../repositories/UserRepository.js';
import roleRepository from '../repositories/RoleRepository.js';

class AuthService {

    async signUp(rawData) {
        const {
            email,
            password,
            name,
            lastName,
            phoneNumber,
            birthdate,
            url_profile,
            adress,
            roles = ['user']
        } = rawData;

        const normalizedEmail = email.trim().toLowerCase();
        const trimmedName = name.trim();
        const trimmedLastName = lastName.trim();
        const trimmedPhoneNumber = phoneNumber.trim();
        const trimmedAdress = typeof adress === 'string' ? adress.trim() || undefined : undefined;
        const trimmedUrlProfile = typeof url_profile === 'string' ? url_profile.trim() || undefined : undefined;

        const existing = await userRepository.findByEmail(normalizedEmail);
        if (existing) {
            const err = new Error('El email ya se encuentra en uso');
            err.status = 400;
            throw err;
        }
  let parsedBirthdate = null;
        if (birthdate) {
            parsedBirthdate = new Date(birthdate);
            if (Number.isNaN(parsedBirthdate.getTime())) {
                const err = new Error('Fecha de nacimiento inválida');
                err.status = 400;
                throw err;
            }
        }

        //lógica par encriptar el password
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '10', 10);
        const hashed = await bcrypt.hash(password, saltRounds);

        // Asignar los role ids
        const roleDocs = [];
        for (const r of roles) {
            let roleDoc = await roleRepository.findByName(r);
            if (!roleDoc) roleDoc = await roleRepository.create({ name: r });
            roleDocs.push(roleDoc._id);
        }

        const user = await userRepository.create({
            email: normalizedEmail,
            password: hashed,
            name: trimmedName,
            lastName: trimmedLastName,
            phoneNumber: trimmedPhoneNumber,
            birthdate: parsedBirthdate,
            url_profile: trimmedUrlProfile,
            adress: trimmedAdress,
            roles: roleDocs
        });
         const userJson = user.toJSON();
        const roleNames = (roles || []).map(r => (typeof r === 'string' ? r : r?.name ?? r));

        return {
            id: userJson._id,
            email: userJson.email,
            name: userJson.name,
            lastName: userJson.lastName,
            phoneNumber: userJson.phoneNumber,
            birthdate: userJson.birthdate,
            url_profile: userJson.url_profile,
            adress: userJson.adress,
            roles: roleNames,
            createdAt: userJson.createdAt
        };
    }

    async signIn({ email, password }) {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await userRepository.findByEmail(normalizedEmail);
        if (!user) {
            const err = new Error('Credenciales inválidas');
            err.status = 401;
            throw err;
        }

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
            const err = new Error('Credenciales inválidas');
            err.status = 401;
            throw err;
        }

        const token = jwt.sign({ 
            sub: user._id, 
            roles: user.roles.map(r => r.name) }, 
            process.env.JWT_SECRET, 
            { 
                expiresIn: process.env.JWT_EXPIRES_IN || '1h' 
            }
        );
        // console.log("Verify:", jwt.verify(token, process.env.JWT_SECRET));

        return { token };
    }
}

export default new AuthService();

