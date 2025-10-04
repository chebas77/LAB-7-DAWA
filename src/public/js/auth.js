const BASE = location.origin; // http://localhost:3000
const api = {
  signIn:  (body) => fetch(`${BASE}/api/auth/signIn`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) }),
  signUp:  (body) => fetch(`${BASE}/api/auth/signUp`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) }),
  me:      (token) => fetch(`${BASE}/api/users/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
  users:   (token) => fetch(`${BASE}/api/users`,    { headers: { 'Authorization': `Bearer ${token}` } })
};

const saveToken = (t) => sessionStorage.setItem('token', t);
const getToken  = () => sessionStorage.getItem('token');
const clearAuth = () => sessionStorage.removeItem('token');

async function routeGuard(requiredRole) {
  const token = getToken();
  if (!token) return location.replace('/signIn');
  const r = await api.me(token);
  if (r.status === 401 || r.status === 403) return location.replace('/signIn');
  const me = await r.json();
  const roles = (me.roles || []).map(r => (typeof r === 'string' ? r : r.name));
  if (requiredRole && !roles.includes(requiredRole)) return location.replace('/403');
  return me;
}

// ---- SignIn page ----
const formSignIn = document.querySelector('#formSignIn');
if (formSignIn) {
  formSignIn.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.querySelector('#email').value.trim();
    const password = document.querySelector('#password').value;
    const r = await api.signIn({ email, password });
    if (!r.ok) return M.toast({html: 'Credenciales inválidas'});
    const data = await r.json();  // { token, ... }
    saveToken(data.token);
    const me = await (await api.me(data.token)).json();
    const roles = (me.roles || []).map(r => (typeof r === 'string' ? r : r.name));
    if (roles.includes('admin')) location.replace('/dashboard/admin');
    else location.replace('/dashboard/user');
  });
}

// ---- SignUp page ----
const formSignUp = document.querySelector('#formSignUp');
if (formSignUp) {
  formSignUp.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
      name: document.querySelector('#name').value.trim(),
      lastName: document.querySelector('#lastName').value.trim(),
      phoneNumber: document.querySelector('#phoneNumber').value.trim(),
      birthdate: document.querySelector('#birthdate').value,
      email: document.querySelector('#email').value.trim(),
      password: document.querySelector('#password').value
    };
    const r = await api.signUp(body);
    if (!r.ok) {
      const err = await r.json().catch(()=>({message:'Error'}));
      return M.toast({html: err.message || 'Error en registro'});
    }
    M.toast({html: 'Registro exitoso, inicia sesión'});
    location.replace('/signIn');
  });
}

// ---- Profile page ----
if (location.pathname === '/profile') {
  (async () => {
    const me = await routeGuard(); // cualquier usuario
    document.querySelector('#whoami').textContent = `${me.name} ${me.lastName} (${me.email})`;
    const ul = document.querySelector('#profileList');
    const fields = ['phoneNumber','birthdate','adress','url_profile','age','createdAt'];
    fields.forEach(k => {
      const li = document.createElement('li'); li.className = 'collection-item';
      li.textContent = `${k}: ${me[k] ?? ''}`;
      ul.appendChild(li);
    });
  })();
}

// ---- User dashboard ----
if (location.pathname === '/dashboard/user') {
  (async () => {
    const me = await routeGuard(); // user o superior
    document.querySelector('#meJson').textContent = JSON.stringify(me, null, 2);
  })();
}

// ---- Admin dashboard ----
if (location.pathname === '/dashboard/admin') {
  (async () => {
    await routeGuard('admin');
    const token = getToken();
    const r = await api.users(token);
    if (r.status === 403) return location.replace('/403');
    const list = await r.json();
    const tbody = document.querySelector('#usersTbody');
    list.forEach(u => {
      const tr = document.createElement('tr');
      const roles = (u.roles || []).map(x => x.name || x).join(', ');
      tr.innerHTML = `<td>${u.name} ${u.lastName || ''}</td><td>${u.email}</td><td>${roles}</td><td>${new Date(u.createdAt).toLocaleString()}</td>`;
      tbody.appendChild(tr);
    });
  })();
}
