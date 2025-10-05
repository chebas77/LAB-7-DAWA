import express from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import seedRoles from './utils/seedRoles.js';
import seedUsers from './utils/seedUsers.js';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import webRoutes from './routes/web.routes.js';

dotenv.config();

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/public', express.static(path.join(__dirname, 'public')));


// Habilitar CORS para todos
app.use(cors());

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Validar estado del servidor
app.get('/health', (req, res) => res.status(200).json({ ok: true }));
// Rutas web (EJS)
app.use('/', webRoutes);

// Fallback 404
app.use((req, res) => {
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(404).json({ message: 'Recurso no encontrado' });
    }
    return res.status(404).render('404', { status: 404 });
});


// Manejador global de errores
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || 'Error interno del servidor' });
    const status = err.status || 500;
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(status).json({ message: err.message || 'Error interno del servidor' });
    }
    if (status === 401 || status === 403) {
        return res.status(status).render('403', { message: err.message || 'No tienes permisos para ver esta página.', status });
    }
    return res.status(status).render('404', {
        message: err.message || (status === 404 ? 'La página que intentas visitar no existe.' : 'Ha ocurrido un error en la aplicación.'),
        status
    });
});


const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI, { autoIndex: true })
    .then( async () => {
        console.log('Mongo connected');
        await seedRoles();
        await seedUsers();
        app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
    })
    .catch(err => {
        console.error('Error al conectar con Mongo:', err);
        process.exit(1);
    });

