const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const path = require('path');

const app = express();
const port = 3000;
// Conexión a la base de datos 'Proyecto' en MongoDB
const conectarMongoDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/Proyecto');
    console.log('Conexión exitosa a MongoDB');
  } catch (err) {
    console.error('Error al conectar a MongoDB:', err);
  }
};
conectarMongoDB();


// Middleware body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Esquema de la colección 'Peliculas'
const peliculaSchema = mongoose.Schema({
  nombre: String,
  año: Number,
  director: String,
  actores: [String]
});

// Modelo de Mongoose para la colección 'Peliculas'
const Pelicula = mongoose.model('Pelicula', peliculaSchema, 'Peliculas');

// Esquema y modelo para la colección 'Usuarios'
const usuarioSchema = mongoose.Schema({
  nombre: String,
  contraseña: String
});
const Usuario = mongoose.model('Usuario', usuarioSchema, 'usuarios');

// Esquema y modelo para la colección 'Admin'
const adminSchema = mongoose.Schema({
  nombre: String,
  contraseña: String
});
const Admin = mongoose.model('Admin', adminSchema, 'admin');

// Función para manejar el inicio de sesión
const iniciarSesion = async (req, res) => {
  const { nombreUsuario, contraseña } = req.body;

  try {
    const usuario = await Usuario.findOne({ nombre: nombreUsuario, contraseña: contraseña });

    if (usuario) {
      return res.redirect('/usuario');
    }
    
    const admin = await Admin.findOne({ nombre: nombreUsuario, contraseña: contraseña });

    if (admin) {
      return res.redirect('/admin');
    }
    
    res.send('Usuario o contraseña incorrectos');
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).send('Error en el servidor');
  }
};

// Ruta para mostrar la página de inicio de sesión
app.get('/login', (req, res) => {
  res.render('login');
});

// Ruta para el inicio de sesión
app.post('/login', iniciarSesion);

// Ruta principal que muestra las películas
const mostrarPeliculas = async (req, res) => {
  try {
    const peliculas = await Pelicula.find();
    console.log('Películas encontradas:', peliculas);
    res.render('index', { peliculas: peliculas });
  } catch (error) {
    console.error('Error al obtener las películas:', error);
    res.status(500).send('Error en el servidor');
  }
};
app.get('/', mostrarPeliculas);

// Ruta para mostrar la página de usuario y enviar los datos de las películas
const mostrarUsuario = async (req, res) => {
  try {
    const peliculas = await Pelicula.find();
    console.log('Películas encontradas:', peliculas);
    res.render('usuario', { peliculas: peliculas });
  } catch (error) {
    console.error('Error al obtener las películas:', error);
    res.status(500).send('Error en el servidor');
  }
};
app.get('/usuario', mostrarUsuario);

// Ruta para mostrar la página de administrador y enviar los datos de las películas
const mostrarAdmin = async (req, res) => {
  try {
    const peliculas = await Pelicula.find();
    console.log('Películas encontradas:', peliculas);
    res.render('admin', { peliculas: peliculas });
  } catch (error) {
    console.error('Error al obtener las películas:', error);
    res.status(500).send('Error en el servidor');
  }
};
app.get('/admin', mostrarAdmin);

// Función para manejar la solicitud POST para editar una película
const editarPelicula = async (req, res) => {
  const id = req.params.id; // Obtener el ID de la película a editar
  const { nombre, año, director, actores } = req.body; // Obtener los nuevos datos de la película del cuerpo de la solicitud

  try {
    // Buscar la película por su ID y actualizar sus datos
    const peliculaActualizada = await Pelicula.findByIdAndUpdate(id, {
      nombre,
      año,
      director,
      actores: actores.split(',').map(actor => actor.trim()) // Separar los actores por coma y eliminar espacios en blanco
    }, { new: true }); // Asegurarse de devolver la película actualizada

    console.log('Película actualizada:', peliculaActualizada);
    res.redirect('/usuario'); // Redirigir a la página de usuario después de guardar los cambios
  } catch (error) {
    console.error('Error al editar la película:', error);
    res.status(500).send('Error en el servidor');
  }
};
app.get('/registro', (req, res) => {
  res.render('registro.ejs');
});

// Ruta POST para el registro
app.post('/registro', async (req, res) => {
  console.log("Datos recibidos:", req.body);

  const { nombre, password } = req.body;
  try {
    const usuarioExistente = await Usuario.findOne({ nombre: nombre });
    if (usuarioExistente) {
      console.log("El nombre de usuario ya está en uso.");
      return res.status(400).send('El nombre de usuario ya está en uso.');
    }

    const nuevoUsuario = new Usuario({
      nombre: nombre,
      contraseña: password
    });

    await nuevoUsuario.save();
    
    console.log("Usuario registrado con éxito:", nuevoUsuario);
    res.redirect('/login');
  } catch (error) {
    console.error("Error al registrar el usuario:", error);
    res.status(500).send('Error al registrar el usuario.');
  }
});


// Ruta para manejar la solicitud POST para editar una película
app.post('/usuario/edit/:id', editarPelicula);

// Función para manejar la solicitud POST para agregar una película
const agregarPelicula = async (req, res) => {
  const { nombre, año, director, actores } = req.body; // Obtener los datos de la película del cuerpo de la solicitud

  try {
    // Crear una nueva instancia de Pelicula con los datos proporcionados
    const nuevaPelicula = new Pelicula({
      nombre,
      año,
      director,
      actores: actores.split(',').map(actor => actor.trim()) // Separar los actores por coma y eliminar espacios en blanco
    });

    // Guardar la nueva película en la base de datos
    await nuevaPelicula.save();

    console.log('Película agregada:', nuevaPelicula);
    res.redirect('/usuario'); // Redirigir a la página de usuario después de agregar la película
  } catch (error) {
    console.error('Error al agregar la película:', error);
    res.status(500).send('Error en el servidor');
  }
};

// Ruta para manejar la solicitud POST para agregar una película
app.post('/usuario/agregar', agregarPelicula);

// Función para manejar la solicitud POST para eliminar una película      
const eliminarPelicula = async (req, res) => {
  const id = req.params.id; // Obtener el ID de la película a eliminar

  try {
    // Buscar la película por su ID y eliminarla de la base de datos
    await Pelicula.findByIdAndDelete(id);

    console.log('Película eliminada:', id);
    res.sendStatus(200); // Enviar una respuesta de estado 200 (OK)
  } catch (error) {
    console.error('Error al eliminar la película:', error);
    res.status(500).send('Error en el servidor');
  }
};

// Ruta para manejar la solicitud POST para eliminar una película
app.post('/usuario/delete/:id', eliminarPelicula);

// Ruta para manejar la solicitud POST para eliminar todas las películas (solo para administradores)
const eliminarTodasLasPeliculas = async (req, res) => {
  try {
    // Eliminar todas las películas de la base de datos
    await Pelicula.deleteMany({});

    console.log('Todas las películas han sido eliminadas');
    res.sendStatus(200); // Enviar una respuesta de estado 200 (OK)
  } catch (error) {
    console.error('Error al eliminar todas las películas:', error);
    res.status(500).send('Error en el servidor');
  }
};

app.get('/buscar', async (req, res) => {
  const query = req.query.p; // Obtener la consulta de búsqueda del parámetro de la URL
  try {
    let peliculas;
    if (query) {
      peliculas = await Pelicula.find({
        $or: [
          { nombre: { $regex: query, $options: 'i' } }, // Buscar por nombre de película (ignorando mayúsculas y minúsculas)
          { director: { $regex: query, $options: 'i' } }, // Buscar por nombre de director (ignorando mayúsculas y minúsculas)
          { actores: { $regex: query, $options: 'i' } } // Buscar por nombre de actor (ignorando mayúsculas y minúsculas)
        ]
      });
    } else {
      peliculas = await Pelicula.find(); // Si no hay consulta, obtener todas las películas
    }
    res.render('index', { peliculas }); // Renderizar la página index.ejs con las películas filtradas
  } catch (error) {
    console.error('Error al buscar películas:', error);
    res.status(500).send('Error en el servidor');
  }
});

// Ruta para manejar la solicitud POST para eliminar todas las películas (solo para administradores)
app.get('/admin/delete-all', eliminarTodasLasPeliculas);

// Ruta para manejar la solicitud POST para eliminar una película (solo para administradores)
app.post('/admin/delete/:id', eliminarPelicula);

// Ruta para manejar la solicitud GET para mostrar la página de administrador
app.get('/admin', mostrarAdmin);

// Función para manejar la solicitud POST para editar una película (solo para administradores)
const editarPeliculaAdmin = async (req, res) => {
  const id = req.params.id; // Obtener el ID de la película a editar
  const { nombre, año, director, actores } = req.body; // Obtener los nuevos datos de la película del cuerpo de la solicitud

  try {
    // Buscar la película por su ID y actualizar sus datos
    const peliculaActualizada = await Pelicula.findByIdAndUpdate(id, {
      nombre,
      año,
      director,
      actores: actores.split(',').map(actor => actor.trim()) // Separar los actores por coma y eliminar espacios en blanco
    }, { new: true }); // Asegurarse de devolver la película actualizada

    console.log('Película actualizada:', peliculaActualizada);  
    res.redirect('/admin'); // Redirigir a la página de administrador después de guardar los cambios
  } catch (error) {
    console.error('Error al editar la película:', error);
    res.status(500).send('Error en el servidor');
  }
};

// Ruta para mostrar el formulario de registro de usuario
app.get('/registro', (req, res) => {
  res.render('registro.ejs');
});

// Ruta para agregar un nuevo usuario
app.post('/registro', async (req, res) => {
  // Aquí deberías tener el código para guardar el nuevo usuario en la base de datos
  // Por ejemplo:
  const nuevoUsuario = new Usuario({
      nombre: req.body.nombreUsuario,
      password: req.body.password
  });
  try {
      await nuevoUsuario.save();
      res.redirect('/login');
  } catch (error) {
      res.status(500).send('Error al agregar el usuario');
  }
});

// Ruta para manejar la solicitud POST para editar una película (solo para administradores)
app.post('/admin/edit/:id', editarPeliculaAdmin);

// Ruta para manejar la solicitud GET para mostrar la página de administrador
app.get('/admin', mostrarAdmin);

const agregarPeliculaAdmin = async (req, res) => {
  const { nombre, año, director, actores } = req.body; // Obtener los datos de la película del cuerpo de la solicitud

  try {
    // Crear una nueva instancia de Pelicula con los datos proporcionados
    const nuevaPelicula = new Pelicula({
      nombre,
      año,
      director,
      actores: actores.split(',').map(actor => actor.trim()) // Separar los actores por coma y eliminar espacios en blanco
    });

    // Guardar la nueva película en la base de datos
    await nuevaPelicula.save();

    console.log('Película agregada:', nuevaPelicula);
    res.redirect('/admin'); // Redirigir a la página de administrador después de agregar la película
  } catch (error) {
    console.error('Error al agregar la película:', error);
    res.status(500).send('Error en el servidor');
  }
};

// Ruta para manejar la solicitud POST para agregar una película (solo para administradores)
app.post('/admin/agregar', agregarPeliculaAdmin);

// Función para manejar la solicitud POST para eliminar todas las películas (solo para administradores)
const eliminarTodasLasPeliculasAdmin = async (req, res) => {
  try {
    // Eliminar todas las películas de la base de datos
    await Pelicula.deleteMany({});

    console.log('Todas las películas han sido eliminadas');
    res.sendStatus(200); // Enviar una respuesta de estado 200 (OK)
  } catch (error) {
    console.error('Error al eliminar todas las películas:', error);
    res.status(500).send('Error en el servidor');
  }
};

// Ruta para manejar la solicitud POST para eliminar todas las películas (solo para administradores)
app.get('/admin/delete-all', eliminarTodasLasPeliculasAdmin);

// Configuración de la carpeta de vistas
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Carpeta de archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));


// Inicio del servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});