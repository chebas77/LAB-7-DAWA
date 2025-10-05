import authService from '../services/AuthService.js';

class AuthController {

    async signUp(req, res, next) {
        try {
            const payload = req.body;
            const requiredFields = ['email', 'password', 'name', 'lastName', 'phoneNumber', 'birthdate'];
            const fieldLabels = {
                email: 'email',
                password: 'password',
                name: 'nombre',
                lastName: 'apellido',
                phoneNumber: 'teléfono',
                birthdate: 'fecha de nacimiento'
            };
            const missing = requiredFields
                .filter(field => !payload[field])
                .map(field => fieldLabels[field] || field);

            if (missing.length > 0)
                return res.status(400).json({ message: `Campos requeridos faltantes: ${missing.join(', ')}` });

            const user = await authService.signUp(payload);
            return res.status(201).json(user);
        } catch (err) {
            next(err);
        }
    }

    async signIn(req, res, next) {
        try {
            const { email, password } = req.body;
            
            if (!email || !password) 
                return res.status(400).json({ message: 'El email y password son requeridos' });
            
            const token = await authService.signIn({ email, password });
            return res.status(200).json(token);
        } catch (err) {
            next(err);
        }
    }
}

export default new AuthController();

