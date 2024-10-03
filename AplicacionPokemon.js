document.addEventListener('DOMContentLoaded', () => {
    const listaPokemonesDiv = document.getElementById('pokemon-list');
    const modal = document.getElementById('pokemon-modal');
    const cerrarModal = document.querySelector('.cerrar'); 
    const nombrePokemonEl = document.getElementById('pokemon-name');
    const imagenPokemonEl = document.getElementById('pokemon-image');
    const alturaPokemonEl = document.getElementById('pokemon-height');
    const pesoPokemonEl = document.getElementById('pokemon-weight');
    const habilidadesPokemonEl = document.getElementById('pokemon-abilities');
    const campoBusqueda = document.getElementById('search');
    const tipoFiltro = document.getElementById('type-filter');
    
    const btnPrev = document.getElementById('prev-page');
    const btnNext = document.getElementById('next-page');

    let currentPage = 1; // Página actual
    const pokemonsPerPage = 10; // Número de Pokémon por página
    let totalPokemons = 0; // Total de Pokémon
    let pokemones = []; // Almacena todos los Pokémon


    // Obtener la lista de tipos de Pokémon
    async function obtenerTiposPokemon() {
        try {
            const respuesta = await fetch(`https://pokeapi.co/api/v2/type`);
            const datos = await respuesta.json();
            datos.results.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo.name;
                option.textContent = tipo.name.charAt(0).toUpperCase() + tipo.name.slice(1); // Capitalizar la primera letra
                tipoFiltro.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar tipos de Pokémon:', error);
        }
    }


    // Alternar estado de favorito
    function alternarFavorito(nombrePokemon, boton) {
        let favoritos = obtenerFavoritos();
        if (favoritos.includes(nombrePokemon)) {
            favoritos = favoritos.filter(fav => fav !== nombrePokemon);
            boton.textContent = 'Marcar como favorito';
            boton.classList.remove('favorited');
        } else {
            favoritos.push(nombrePokemon);
            boton.textContent = 'Favorito';
            boton.classList.add('favorited');
        }
        localStorage.setItem('favoritos', JSON.stringify(favoritos));
    }

    // Obtener los favoritos del localStorage
    function obtenerFavoritos() {
        return JSON.parse(localStorage.getItem('favoritos')) || [];
    }

    // Verificar si un Pokémon es favorito
    function esFavorito(nombrePokemon) {
        return obtenerFavoritos().includes(nombrePokemon);
    }

    // Función de búsqueda que consulta a la API de PokeAPI
    campoBusqueda.addEventListener('input', (e) => {
        const consulta = e.target.value.trim(); // Obtener el texto ingresado
        if (consulta) {
            obtenerPokemonPorNombre(consulta); // Realizar búsqueda en la API
        } else {
            cargarPokemones(); // Volver a cargar Pokémons
        }
    });

    // Mostrar tarjetas de Pokémon (puede ser solo uno)
    function mostrarPokemones(pokemonesFiltrados) {
        listaPokemonesDiv.innerHTML = ''; // Limpiar lista actual
        pokemonesFiltrados.forEach((pokemon) => {
            const tarjetaPokemon = crearTarjetaPokemon(pokemon);
            listaPokemonesDiv.appendChild(tarjetaPokemon);
        });
    }

    // Crear la tarjeta de Pokémon
    function crearTarjetaPokemon(pokemon) {
        const tarjeta = document.createElement('div');
        tarjeta.classList.add('pokemon-card');

        const imagen = document.createElement('img');
        imagen.src = pokemon.sprites ? pokemon.sprites.front_default : 'ruta/a/imagen/por/defecto.png'; // Imagen por defecto
        imagen.alt = pokemon.name;

        const nombre = document.createElement('h3');
        nombre.textContent = pokemon.name;
        tarjeta.addEventListener('click', () => mostrarDetallesPokemon(pokemon));

        const botonFavorito = document.createElement('button');
        botonFavorito.textContent = esFavorito(pokemon.name) ? 'Favorito' : 'Marcar como favorito';
        botonFavorito.classList.add('favorite-button');
        if (esFavorito(pokemon.name)) {
            botonFavorito.classList.add('favorited');
        }

        botonFavorito.addEventListener('click', () => alternarFavorito(pokemon.name, botonFavorito));


        tarjeta.appendChild(imagen);
        tarjeta.appendChild(nombre);
        tarjeta.appendChild(botonFavorito);

        return tarjeta;
    }

    // Mostrar los detalles del Pokémon en el modal
    function mostrarDetallesPokemon(pokemon) {
        nombrePokemonEl.textContent = pokemon.name;
        imagenPokemonEl.src = pokemon.sprites ? pokemon.sprites.front_default : 'ruta/a/imagen/por/defecto.png'; // Imagen por defecto
        alturaPokemonEl.textContent = `${pokemon.height} decímetros`;
        pesoPokemonEl.textContent = `${pokemon.weight} hectogramos`;
        habilidadesPokemonEl.textContent = pokemon.abilities.map(ability => ability.ability.name).join(', ');

        modal.style.display = 'block'; // Mostrar el modal

    }

    // Obtener datos de un Pokémon por nombre o ID de la API
    async function obtenerPokemonPorNombre(nombre) {
        try {
            const respuesta = await fetch(`https://pokeapi.co/api/v2/pokemon/${nombre.toLowerCase()}`);
            if (!respuesta.ok) {
                throw new Error(`Pokémon no encontrado: ${nombre}`); // Mensaje de error
            }
            const datosPokemon = await respuesta.json();
            mostrarPokemones([datosPokemon]); // Mostrar solo el Pokémon encontrado
        } catch (error) {
            console.error('Error al buscar el Pokémon:', error);
            listaPokemonesDiv.innerHTML = `<p>${error.message}</p>`; // Mostrar error
        }
    }

    // Cargar Pokémon por tipo
    async function cargarPokemonesPorTipo(tipo) {
        try {
            const respuesta = await fetch(`https://pokeapi.co/api/v2/type/${tipo}`);
            const datos = await respuesta.json();

            // Crear un array para obtener detalles de cada Pokémon filtrado
            const detallesPokemones = await Promise.all(
                datos.pokemon.map(async (p) => {
                    const respuestaDetalles = await fetch(p.pokemon.url); // Segunda petición para obtener detalles
                    return await respuestaDetalles.json();
                })
            );

            mostrarPokemones(detallesPokemones); // Mostrar solo los Pokémon de este tipo
        } catch (error) {
            console.error('Error al cargar Pokémon por tipo:', error);
        }
    }

    // Filtrar por tipo
    tipoFiltro.addEventListener('change', async (e) => {
        const tipoSeleccionado = e.target.value;
        if (tipoSeleccionado) {
            await cargarPokemonesPorTipo(tipoSeleccionado);
        } else {
            cargarPokemones(); // Si no hay tipo seleccionado, cargar todos los Pokémon
        }
    });

    

    // Cargar los Pokémon en bloques de 10
    async function cargarPokemones() {
        try {
            const respuesta = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${pokemonsPerPage}&offset=${(currentPage - 1) * pokemonsPerPage}`);
            const datos = await respuesta.json();
            pokemones = datos.results;

            // Hacer una segunda petición para obtener los detalles de cada Pokémon
            const detallesPokemones = await Promise.all(
                pokemones.map(async (pokemon) => {
                    const respuestaDetalles = await fetch(pokemon.url); // Segunda petición
                    return await respuestaDetalles.json();
                })
            );

            mostrarPokemones(detallesPokemones); // detalles de los Pokémon

            // Actualizar el total de Pokémon
            totalPokemons = datos.count; // Total de Pokémon desde la API
        } catch (error) {
            console.error('Error al cargar los Pokémon:', error);
        }
    }

    // Cambiar de página
    btnPrev.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--; // Decrementar la página
            cargarPokemones(); // Cargar Pokémon de la nueva página
        }
    });

    btnNext.addEventListener('click', () => {
        const totalPages = Math.ceil(totalPokemons / pokemonsPerPage); // Calcular el total de páginas
        if (currentPage < totalPages) {
            currentPage++; // Incrementar la página
            cargarPokemones(); // Cargar Pokémon de la nueva página
            window.scrollTo(0, 0); // Desplazar hacia arriba
        }
    });

    // Cargar los primeros 10 Pokémon al inicio
    async function cargarPokemonesIniciales() {
        await obtenerTiposPokemon(); // Obtener los tipos de Pokémon
        currentPage = 1; // Reiniciar a la primera página
        await cargarPokemones(); // Cargar Pokémon
    }

    // Cerrar el modal cuando se hace clic fuera del contenido del modal
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Agregar evento al botón de cerrar
    if (cerrarModal) {
        cerrarModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // Cargar los primeros 10 Pokémon al inicio
    cargarPokemonesIniciales();
    
});
