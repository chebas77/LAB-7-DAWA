import express from 'express';
const router = express.Router();

// Páginas públicas
router.get('/signIn', (req, res) => res.render('signIn'));
router.get('/signUp', (req, res) => res.render('signUp'));

// Protegidas por front (JS) con token en sessionStorage
router.get('/profile', (req, res) => res.render('profile'));
router.get('/dashboard/user', (req, res) => res.render('dashboardUser'));
router.get('/dashboard/admin', (req, res) => res.render('dashboardAdmin'));

// Errores
router.get('/403', (req, res) => res.status(403).render('403'));
router.get('/404', (req, res) => res.status(404).render('404'));

export default router;
