const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 3000;

app.use(session({
  secret: 'M1nh4Chav3S3cr3t4',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,  
    httpOnly: true,
    maxAge: 1000 * 60 * 30 // Sessão válida por 30 minutos
  }
}));

app.use(cookieParser());

app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(process.cwd(), 'public')));

let interessados = [];
let pets = [];
let adocoes = [];
const usuarioFixo = { login: 'admin', senha: '1234' };

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.post('/login', (req, res) => {
  const { login, senha } = req.body;

  if (login === usuarioFixo.login && senha === usuarioFixo.senha) {
    req.session.logado = true;
    res.cookie('ultimoAcesso', new Date().toLocaleString(), { maxAge: 30 * 60 * 1000, httpOnly: true });
    res.redirect('/menu');
  } else {
    res.send(`
      <html>
        <body>
          <h3>Credenciais inválidas! <a href="/">Tente novamente</a></h3>
        </body>
      </html>
    `);
  }
});


app.get('/menu', (req, res) => {
  if (!req.session.logado) return res.redirect('/');
  const ultimoAcesso = req.cookies.ultimoAcesso || 'Primeiro acesso';
  res.send(`
    <html>
      <body>
        <h1>Menu do Sistema</h1>
        <p>Último acesso: ${ultimoAcesso}</p>
        <ul>
          <li><a href="/cadastro-interessado">Cadastrar Interessado</a></li>
          <li><a href="/cadastro-pet">Cadastrar Pet</a></li>
          <li><a href="/adocao">Adotar um Pet</a></li>
        </ul>
        <a href="/logout">Logout</a>
      </body>
    </html>
  `);
});


app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.send('Erro ao encerrar a sessão.');
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

app.get('/cadastro-interessado', (req, res) => {
  if (!req.session.logado) return res.redirect('/');
  res.send(`
    <html>
      <body>
        <h1>Cadastro de Interessado</h1>
        <form method="POST" action="/cadastro-interessado">
          <input type="text" name="nome" placeholder="Nome" required /><br><br>
          <input type="email" name="email" placeholder="Email" required /><br><br>
          <input type="text" name="telefone" placeholder="Telefone" required maxlength="15" /><br><br>
          <button type="submit">Cadastrar</button>
        </form>
        <a href="/menu">Voltar ao Menu</a>
      </body>
    </html>
  `);
});

app.post('/cadastro-interessado', (req, res) => {
  const { nome, email, telefone } = req.body;
  if (!nome || !email || !telefone) {
    return res.send(`
      <html>
        <body>
          <h3>Todos os campos são obrigatórios!</h3>
          <a href="/cadastro-interessado">Voltar</a>
        </body>
      </html>
    `);
  }
  interessados.push({ nome, email, telefone });
  res.redirect('/lista-interessados');
});


app.get('/lista-interessados', (req, res) => {
  if (!req.session.logado) return res.redirect('/');
  const lista = interessados.map(i => `<li>${i.nome} - ${i.email} - ${i.telefone}</li>`).join('');
  res.send(`
    <html>
      <body>
        <h1>Lista de Interessados</h1>
        <ul>${lista}</ul>
        <a href="/cadastro-interessado">Voltar para Cadastro de Interessado</a>
        <a href="/menu">Voltar ao Menu</a>
      </body>
    </html>
  `);
});


app.get('/cadastro-pet', (req, res) => {
  if (!req.session.logado) return res.redirect('/');
  res.send(`
    <html>
      <body>
        <h1>Cadastro de Pets</h1>
        <form method="POST" action="/cadastro-pet">
          <input type="text" name="nome" placeholder="Nome" required /><br><br>
          <input type="text" name="raca" placeholder="Raça" required /><br><br>
          <input type="number" name="idade" placeholder="Idade (anos)" required /><br><br>
          <button type="submit">Cadastrar</button>
        </form>
        <a href="/menu">Voltar ao Menu</a>
      </body>
    </html>
  `);
});

app.post('/cadastro-pet', (req, res) => {
  const { nome, raca, idade } = req.body;
  if (nome && raca && idade) {
    pets.push({ nome, raca, idade });
    res.redirect('/lista-pets');
  } else {
    res.send('<h3>Todos os campos são obrigatórios! <a href="/cadastro-pet">Voltar</a></h3>');
  }
});


app.get('/lista-pets', (req, res) => {
  if (!req.session.logado) return res.redirect('/');
  const lista = pets.map(p => `<li>${p.nome} - ${p.raca} - ${p.idade} anos</li>`).join('');
  res.send(`
    <html>
      <body>
        <h1>Lista de Pets</h1>
        <ul>${lista}</ul>
        <a href="/cadastro-pet">Voltar para Cadastro de Pet</a>
        <a href="/menu">Voltar ao Menu</a>
      </body>
    </html>
  `);
});

app.get('/adocao', (req, res) => {
  if (!req.session.logado) return res.redirect('/');
  const interessadosOptions = interessados.map(i => `<option>${i.nome}</option>`).join('');
  const petsOptions = pets.map(p => `<option>${p.nome}</option>`).join('');
  res.send(`
    <html>
      <body>
        <h1>Adotar um Pet</h1>
        <form method="POST" action="/adocao">
          <label>Interessado:</label>
          <select name="interessado">${interessadosOptions}</select><br><br>
          <label>Pet:</label>
          <select name="pet">${petsOptions}</select><br><br>
          <button type="submit">Registrar Adoção</button>
        </form>
        <h2>Registros de Adoção:</h2>
        <ul>${adocoes.map(a => `<li>${a.interessado} demonstrou interesse em ${a.pet} em ${a.data}</li>`).join('')}</ul>
        <a href="/menu">Voltar ao Menu</a>
      </body>
    </html>
  `);
});

app.post('/adocao', (req, res) => {
  const { interessado, pet } = req.body;
  if (interessado && pet) {
    const data = new Date().toLocaleString();
    adocoes.push({ interessado, pet, data });
    res.redirect('/adocao');
  } else {
    res.send('<h3>Todos os campos são obrigatórios! <a href="/adocao">Voltar</a></h3>');
  }
});

app.get('/lista-adocoes', (req, res) => {
  if (!req.session.logado) return res.redirect('/');
  const listaAdocoes = adocoes.map(a => `<li>${a.interessado} adotou ${a.pet} em ${a.data}</li>`).join('');
  res.send(`
    <html>
      <body>
        <h1>Lista de Adoções</h1>
        <ul>${listaAdocoes}</ul>
        <a href="/adocao">Voltar para Adoção</a>
        <a href="/menu">Voltar ao Menu</a>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
