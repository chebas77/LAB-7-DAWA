const BASE = location.origin; // http://localhost:3000
const api = {
  signIn:  (body) => fetch(`${BASE}/api/auth/signIn`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) }),
  signUp:  (body) => fetch(`${BASE}/api/auth/signUp`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) }),
  me:      (token) => fetch(`${BASE}/api/users/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
  users:   (token) => fetch(`${BASE}/api/users`,    { headers: { 'Authorization': `Bearer ${token}` } }),
  updateMe:(token, body) => fetch(`${BASE}/api/users/me`, { method: 'PUT', headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }, body: JSON.stringify(body) })
};
const saveToken = (t) => sessionStorage.setItem('token', t);
const getToken  = () => sessionStorage.getItem('token');
const clearAuth = () => sessionStorage.removeItem('token');

async function routeGuard(requiredRole) {
  const token = getToken();
  if (!token) return location.replace('/signIn');
  const r = await api.me(token);
  if (r.status === 401 || r.status === 403) {
    clearAuth();
    return location.replace('/signIn');
  }
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
    const adressEl = document.querySelector('#adress');
    const urlProfileEl = document.querySelector('#url_profile');
    const body = {
      name: document.querySelector('#name').value.trim(),
      lastName: document.querySelector('#lastName').value.trim(),
      phoneNumber: document.querySelector('#phoneNumber').value.trim(),
      birthdate: document.querySelector('#birthdate').value,
      email: document.querySelector('#email').value.trim(),
      password: document.querySelector('#password').value,
      adress: adressEl ? adressEl.value.trim() : undefined,
      url_profile: urlProfileEl ? urlProfileEl.value.trim() : undefined
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
    renderProfile(me);

    const form = document.querySelector('#formProfile');
    if (form) {
      fillProfileForm(form, me);
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = getToken();
        const body = {
          name: form.querySelector('#profileName').value.trim(),
          lastName: form.querySelector('#profileLastName').value.trim(),
          phoneNumber: form.querySelector('#profilePhoneNumber').value.trim(),
          birthdate: form.querySelector('#profileBirthdate').value,
          adress: form.querySelector('#profileAdress').value.trim(),
          url_profile: form.querySelector('#profileUrl').value.trim()
        };
        const r = await api.updateMe(token, body);
        if (!r.ok) {
          const err = await r.json().catch(() => ({ message: 'No se pudo actualizar' }));
          return M.toast({ html: err.message || 'No se pudo actualizar' });
        }
        const updated = await r.json();
        renderProfile(updated);
        fillProfileForm(form, updated);
        if (window.M?.updateTextFields) window.M.updateTextFields();
        M.toast({ html: 'Perfil actualizado' });
      });
      if (window.M?.updateTextFields) window.M.updateTextFields();
    }
  })();
}
function renderProfile(me) {
  const whoami = document.querySelector('#whoami');
  if (whoami) whoami.textContent = `${me.name} ${me.lastName || ''} (${me.email})`;
  const ul = document.querySelector('#profileList');
  if (!ul) return;
  ul.innerHTML = '';
  const fields = [
    { key: 'phoneNumber', label: 'Teléfono' },
    { key: 'birthdate', label: 'Fecha de nacimiento' },
    { key: 'adress', label: 'Dirección' },
    { key: 'url_profile', label: 'URL Perfil' },
    { key: 'roles', label: 'Roles' },
    { key: 'age', label: 'Edad' },
    { key: 'createdAt', label: 'Registro' }
  ];
  fields.forEach(({ key, label }) => {
    const li = document.createElement('li');
    li.className = 'collection-item';
    let value = me[key] ?? '';
    if (Array.isArray(value)) value = value.map(r => (typeof r === 'string' ? r : r.name)).join(', ');
    if (key === 'birthdate' && value) value = formatDate(value);
    if ((key === 'createdAt' || key === 'updatedAt') && value) {
      const date = new Date(value);
      value = Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
    }
    if (key === 'url_profile' && value) {
      li.innerHTML = `${label}: <a href="${value}" target="_blank" rel="noopener">${value}</a>`;
    } else {
      li.textContent = `${label}: ${value}`;
    }
    ul.appendChild(li);
  });
}

function fillProfileForm(form, me) {
  form.querySelector('#profileName').value = me.name ?? '';
  form.querySelector('#profileLastName').value = me.lastName ?? '';
  form.querySelector('#profilePhoneNumber').value = me.phoneNumber ?? '';
  form.querySelector('#profileBirthdate').value = formatDate(me.birthdate);
  form.querySelector('#profileAdress').value = me.adress ?? '';
  form.querySelector('#profileUrl').value = me.url_profile ?? '';
  form.querySelector('#profileEmail').value = me.email ?? '';
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

// ---- User dashboard ----
if (location.pathname === '/dashboard/user') {
  (async () => {
    const me = await routeGuard(); // user o superior
    const welcome = document.querySelector('#userWelcome');
    if (welcome) welcome.textContent = `Hola ${me.name} ${me.lastName || ''}`;
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
    tbody.innerHTML = '';
    list.forEach(u => {
      const tr = document.createElement('tr');
      const roles = (u.roles || []).map(x => x.name || x).join(', ');
      tr.innerHTML = `<td>${u.name} ${u.lastName || ''}</td><td>${u.email}</td><td>${roles}</td><td>${new Date(u.createdAt).toLocaleString()}</td>`;
      const actionTd = document.createElement('td');
      const btn = document.createElement('button');
      btn.className = 'btn-small blue lighten-1';
      btn.type = 'button';
      btn.textContent = 'Ver';
      btn.addEventListener('click', () => showUserDetail(u));
      actionTd.appendChild(btn);
      tr.appendChild(actionTd);
      tbody.appendChild(tr);
    });
  })();
}


function showUserDetail(user) {
  const card = document.querySelector('#userDetailCard');
  if (!card) return;
  card.style.display = 'block';
  document.querySelector('#detailTitle').textContent = `${user.name} ${user.lastName || ''}`;
  document.querySelector('#detailEmail').textContent = user.email || '';
  document.querySelector('#detailPhone').textContent = user.phoneNumber || '';
  document.querySelector('#detailBirthdate').textContent = formatDate(user.birthdate);
  document.querySelector('#detailAdress').textContent = user.adress || '';
  const urlSpan = document.querySelector('#detailUrl');
  if (user.url_profile) {
    urlSpan.innerHTML = `<a href="${user.url_profile}" target="_blank" rel="noopener">${user.url_profile}</a>`;
  } else {
    urlSpan.textContent = '';
  }
  document.querySelector('#detailRoles').textContent = (user.roles || []).map(r => r.name || r).join(', ');
  document.querySelector('#detailAge').textContent = user.age ?? '';
  document.querySelector('#detailCreated').textContent = user.createdAt ? new Date(user.createdAt).toLocaleString() : '';
}