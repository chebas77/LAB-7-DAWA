import userRepository from '../repositories/UserRepository.js';

class UserService {

    async getAll() {
        const users = await userRepository.getAll();
        return users.map(user => this.#mapUser(user));
    }

    async getById(id) {
        const user = await userRepository.findById(id);
        if (!user) {
            const err = new Error('Usuario no encontrado');
            err.status = 404;
            throw err;
        }
        return this.#mapUser(user);
    }

    async updateById(id, payload) {
        const allowed = ['name', 'lastName', 'phoneNumber', 'birthdate', 'url_profile', 'adress'];
        const data = {};
        for (const field of allowed) {
            if (payload[field] !== undefined) {
                data[field] = payload[field];
                if (typeof data[field] === 'string') {
                    data[field] = data[field].trim();
                    if (!data[field]) {
                        if (['name', 'lastName', 'phoneNumber'].includes(field)) {
                            const err = new Error(`El campo ${field} no puede estar vacío`);
                            err.status = 400;
                            throw err;
                        }
                        data[field] = undefined;
                    }
                }
            }
        }

        if (data.birthdate) {
            const parsed = new Date(data.birthdate);
            if (Number.isNaN(parsed.getTime())) {
                const err = new Error('Fecha de nacimiento inválida');
                err.status = 400;
                throw err;
            }
            data.birthdate = parsed;
        }

        const updated = await userRepository.updateById(id, data);
        if (!updated) {
            const err = new Error('Usuario no encontrado');
            err.status = 404;
            throw err;
        }
        return this.#mapUser(updated);
    }

    #mapUser(user) {
        const roles = (user.roles || []).map(r => r.name ?? r);
        return {
            id: user._id,
            email: user.email,
            name: user.name,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            birthdate: user.birthdate,
            url_profile: user.url_profile,
            adress: user.adress,
            roles,
            age: user.age,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    }
}

export default new UserService();