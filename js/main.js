/* Variables globales */
let verPresupuesto = false;
let mensajeBienvenida = "";

class Transaccion {
    constructor() {
        this.id = null;
        this.nombre = null;
        this.valor = null;
        this.tipo = null;
    }
}

class GestorTransacciones {
    constructor() {
        this.ingresos = [];
        this.ahorros = [];
        this.gastos = [];
        this.presupuesto = 0;
        this.contadorId = 1;
    }

    /* Mapeo (1 => Ingreso, 2 => Gasto, 3 => Ahorro) */
    devolverTipoTransaccion(numeroTipoTransaccion) {
        const tipos = ["Tipo no válido", "Ingreso", "Gasto", "Ahorro"];
        return tipos[numeroTipoTransaccion] || tipos[0];
    }

    /* Metodo auxiliar utilizado por el metodo agregarTransaccion(tipo) */
    agregarTransaccionAListaPorTipo(transaccion) {
        const tipo = transaccion.tipo.toLowerCase();
        if (["ingreso", "gasto", "ahorro"].includes(tipo)) {
            this[tipo + "s"].push(transaccion);
        } else {
            console.log("Error, el tipo de transacción a agregar no es admitido");
            return;
        }
    }

    /* Agrega una transaccion al sistema segun su tipo */
    agregarTransaccion(tipo) {
        const containerDiv = document.querySelector('.container');

        const formularioHtml = `
        <div class="formulario-agregar d-grid gap-2 justify-content-center align-items-center mb-4">
            <h2>Agregar transacción</h2>
            <input type="text" id="nombreTransaccionInput" class="form-control mb-3" placeholder="Nombre de la transacción">
            <input type="number" id="valorTransaccionInput" class="form-control mb-3" placeholder="Valor de la transacción">
            <button class="btn btn-primary" id="confirmarAgregarTransaccion">Confirmar</button>
            <button class="btn btn-danger" id="cancelarAgregarTransaccion">Cancelar</button>
        </div>
    `;

        containerDiv.innerHTML = formularioHtml;

        const confirmarBtn = document.getElementById('confirmarAgregarTransaccion');
        const cancelarBtn = document.getElementById('cancelarAgregarTransaccion');
        const nombreTransaccionInput = document.getElementById('nombreTransaccionInput');
        const valorTransaccionInput = document.getElementById('valorTransaccionInput');

        confirmarBtn.addEventListener('click', () => {
            const nombreTransaccion = nombreTransaccionInput.value.trim();
            const valorTransaccion = parseFloat(valorTransaccionInput.value.trim());

            if (!isNaN(valorTransaccion) && valorTransaccion >= 0 && nombreTransaccion) {
                this.agregarTransaccionAListaPorTipo({
                    id: this.contadorId++,
                    nombre: nombreTransaccion,
                    valor: valorTransaccion,
                    tipo: tipo
                });
                guardarGestorTransaccionesEnLocalStorage(this);
                verPresupuesto = true;

                containerDiv.innerHTML = '';
                mostrarMensajeTemporal(`La transacción "${nombreTransaccion}" ha sido agregada exitosamente.`);
                setTimeout(() => {
                    mostrarMenuPrincipal(this);
                }, 3000);
            } else {
                const errorHtml = `<div class="mensaje error">Por favor, ingrese un nombre y un valor válidos para la transacción.</div>`;
                containerDiv.insertAdjacentHTML('beforeend', errorHtml);
            }
        });

        cancelarBtn.addEventListener('click', () => {
            containerDiv.innerHTML = '';
            mostrarMenuPrincipal(this);
        });
    }

    /* Elimina una transaccion segun el nombre y el tipo especificado */
    eliminarTransaccion(nombreTransaccion, tipo) {
        const lista = this[tipo.toLowerCase() + "s"];
        const posicion = lista.findIndex(t => t.nombre === nombreTransaccion);
        const containerDiv = document.querySelector('.container');

        if (posicion !== -1) {
            lista.splice(posicion, 1);
            // Actualizar el objeto gestorTransacciones en el localStorage
            guardarGestorTransaccionesEnLocalStorage(this);
            containerDiv.innerHTML = '';
            mostrarMensajeTemporal(`La transacción "${nombreTransaccion}" ha sido eliminada exitosamente.`);
            setTimeout(() => {
                mostrarMenuPrincipal(this);
            }, 3000);
        } else {
            containerDiv.innerHTML = '';
            mostrarMensajeTemporal(`La transacción con nombre "${nombreTransaccion}" que desea eliminar no existe.`);
            setTimeout(() => {
                mostrarMenuPrincipal(this);
            }, 3000);
        }
    }

    /* Suma los valores de los arrays segun el tipo */
    calcularTotalPorTipo(tipo) {
        let arrayTransacciones;
        switch (tipo) {
            case "Ingreso":
                arrayTransacciones = this.ingresos;
                break;
            case "Gasto":
                arrayTransacciones = this.gastos;
                break;
            case "Ahorro":
                arrayTransacciones = this.ahorros;
                break;
            default:
                containerDiv.innerHTML = '';
                mostrarMensajeTemporal("Error, tipo de transacción no admitido");
                setTimeout(() => {
                    mostrarMenuPrincipal(this);
                }, 3000);
                return 0;
        }

        return arrayTransacciones.reduce((total, transaccion) => (transaccion && transaccion.valor) ? total + transaccion.valor : total, 0);
    }

    /* Calcula balance del presupuesto (Ahorros + Ingresos - Gastos) */
    calcularPresupuesto() {
        const ingresosTotales = this.calcularTotalPorTipo("Ingreso");
        const gastosTotales = this.calcularTotalPorTipo("Gasto");
        const ahorrosTotales = this.calcularTotalPorTipo("Ahorro");

        const containerDiv = document.querySelector('.container');

        if (ingresosTotales >= 0 && gastosTotales >= 0 && ahorrosTotales >= 0 && verPresupuesto) {
            this.presupuesto = ingresosTotales + ahorrosTotales - gastosTotales;

            const presupuestoDiv = document.createElement('div');
            presupuestoDiv.textContent = `El presupuesto actual es: ${this.presupuesto}`;
            presupuestoDiv.classList.add('mensaje');

            containerDiv.appendChild(presupuestoDiv);

            setTimeout(() => {
                presupuestoDiv.remove();
            }, 3000);
        } else {
            const mensajeDiv = document.createElement('div');
            mensajeDiv.textContent = "No hay suficiente información para calcular el presupuesto";
            mensajeDiv.classList.add('mensaje');

            containerDiv.appendChild(mensajeDiv);

            setTimeout(() => {
                mensajeDiv.remove();
            }, 3000);
        }
    }

    /* Devuelve true o false segun si encuentra transacciones del tipo especificado */
    hayTransacciones(tipo) {
        return this[tipo.toLowerCase() + "s"].length > 0;
    }

    /* Busca transacciones por el nombre entre todos los tipos de transaccion */
    buscarTransaccion(nombre) {
        const transaccionesEncontradas = [...this.ingresos, ...this.gastos, ...this.ahorros]
            .filter(transaccion => transaccion.nombre.toLowerCase().includes(nombre.toLowerCase()));
        return transaccionesEncontradas;
    }

    /* Filtra transacciones segun el tipo entre dos valores */
    filtrarTransacciones(tipo, valorMinimo, valorMaximo) {
        const transaccionesFiltradas = [...this[tipo.toLowerCase() + "s"]].filter(transaccion => {
            return (!isNaN(valorMinimo) && transaccion.valor >= valorMinimo) && (!isNaN(valorMaximo) && transaccion.valor <= valorMaximo);
        });
        return transaccionesFiltradas;
    }
}

function mostrarMenuPrincipal(gestorTransacciones) {
    //mostrarMensaje(mensajeBienvenida, "bienvenidaUsuario");
    const menuHtml = `<div class="menu">
    <h2>Gestión de transacciones</h2>
    <p>Ingrese una opción del 1 al 6:</p>
    <ol>
        <li><button id="opcion1">1. Agregar o eliminar transacciones</button></li>
        <li><button id="opcion2">2. Buscar transacción</button></li>
        <li><button id="opcion3">3. Filtrar transacciones</button></li>
        <li><button id="opcion4">4. Ver transacciones</button></li>
        <li><button id="opcion5">5. Calcular presupuesto</button></li>
        <li><button id="opcion6">6. Salir</button></li>
    </ol>
</div>
`;
    // Agregar el menu a la pagina
    const containerDiv = document.querySelector('.container');

    containerDiv.innerHTML += menuHtml;

    // Agregar eventos a los botones del menu
    document.getElementById('opcion1').addEventListener('click', () => gestionarTransaccionesSubMenu(gestorTransacciones));
    document.getElementById('opcion2').addEventListener('click', () => buscarTransaccionSubMenu(gestorTransacciones));
    document.getElementById('opcion3').addEventListener('click', () => filtrarTransaccionesSubMenu(gestorTransacciones));
    document.getElementById('opcion4').addEventListener('click', () => verTransaccionesSubMenu(gestorTransacciones));
    document.getElementById('opcion5').addEventListener('click', () => gestorTransacciones.calcularPresupuesto());
    document.getElementById('opcion6').addEventListener('click', salirSubMenu);


}

async function principal() {
    try {
        const datos = await cargarDatosDesdeJSON();
        const gestorTransacciones = new GestorTransacciones();

        // Asignar los datos recuperados al gestor de transacciones
        gestorTransacciones.ingresos = datos.filter(transaccion => transaccion.tipo === 'Ingreso');
        gestorTransacciones.gastos = datos.filter(transaccion => transaccion.tipo === 'Gasto');
        gestorTransacciones.ahorros = datos.filter(transaccion => transaccion.tipo === 'Ahorro');
        // Verificar si hay datos de transacciones en el JSON para poder ver el presupuesto y guardarlas en el localstorage
        if (gestorTransacciones.ingresos.length > 0 || gestorTransacciones.gastos.length > 0 || gestorTransacciones.ahorros.length > 0) {
            verPresupuesto = true; // Establecer verPresupuesto en true si hay datos de transacciones
            guardarGestorTransaccionesEnLocalStorage(gestorTransacciones);
        }
        mostrarMenuPrincipal(gestorTransacciones);
    } catch (error) {
        console.error(error);
    }
}

/* Submenu para agregar/eliminar transacciones */
function gestionarTransaccionesSubMenu(gestorTransacciones) {
    const subMenuHtml = `
        <div class="submenu">
            <h2>Seleccione una opción:</h2>
            <button class="submenuBtn" id="agregarTransaccion">Agregar transacción</button>
            <button class="submenuBtn" id="eliminarTransaccion">Eliminar transacción</button>
            <button class="submenuBtn" id="volverAlmenuPrincipal">Volver al menú principal</button>
        </div>
    `;

    const containerDiv = document.querySelector('.container');
    containerDiv.innerHTML = subMenuHtml;

    // Agregar eventos a los botones del submenu
    document.getElementById('agregarTransaccion').addEventListener('click', () => mostrarFormularioAgregarTransaccion(gestorTransacciones));
    document.getElementById('eliminarTransaccion').addEventListener('click', () => eliminarTransaccionSubMenu(gestorTransacciones));
    document.getElementById('volverAlmenuPrincipal').addEventListener('click', () => {
        containerDiv.innerHTML = "";
        mostrarMenuPrincipal(gestorTransacciones);
    });
}

function mostrarFormularioAgregarTransaccion(gestorTransacciones) {
    const formularioHtml = `
            <div class="formulario-agregar d-grid gap-2 justify-content-center align-items-center mb-4">
            <h2>Agregar transacción</h2>
            <div class="form-floating mb-3">
                <select class="form-select" id="tipoTransaccionAgregar">
                    <option value="Ingreso">Ingreso</option>
                    <option value="Gasto">Gasto</option>
                    <option value="Ahorro">Ahorro</option>
                </select>
                <label for="tipoTransaccion">Tipo de transacción</label>
            </div>
            <button class="btn btn-primary" id="confirmarAgregarTransaccion">Confirmar</button>
            <button class="btn btn-danger" id="cancelarAgregarTransaccion">Cancelar</button>
        </div>
        `;

    const containerDiv = document.querySelector('.container');
    containerDiv.innerHTML = formularioHtml;

    const confirmarBtn = document.getElementById('confirmarAgregarTransaccion');
    const cancelarBtn = document.getElementById('cancelarAgregarTransaccion');

    confirmarBtn.addEventListener('click', () => {
        const elementoSelect = document.getElementById('tipoTransaccionAgregar');
        const valorSelccionado = elementoSelect.value;
        gestorTransacciones.agregarTransaccion(valorSelccionado);
    });

    cancelarBtn.addEventListener('click', () => {
        containerDiv.innerHTML = "";
        mostrarMenuPrincipal(gestorTransacciones);
    });
}

/* Submenu para eliminar transaccion segun su tipo */
function eliminarTransaccionSubMenu(gestorTransacciones) {
    const formularioHtml = `
    <div class="formulario-eliminar d-grid gap-3 justify-content-center mb-4">
        <h2 class="text-center">Eliminar transacción</h2>
        <div class="form-floating">
            <select class="form-select" id="seleccionCategoria">
                <option value="1">Ingreso</option>
                <option value="2">Gasto</option>
                <option value="3">Ahorro</option>
            </select>
            <label for="seleccionCategoria">Tipo de transacción</label>
        </div>
        <div class="form-floating">
            <input type="text" class="form-control" id="nombreTransaccion" placeholder="Nombre de la transacción">
            <label for="nombreTransaccion">Nombre de la transacción</label>
        </div>
        <button class="btn btn-danger" id="eliminarTransaccion">Eliminar</button>
        <button class="btn btn-secondary" id="cancelarEliminarTransaccion">Cancelar</button>
        </div>
    `;

    const containerDiv = document.querySelector('.container');
    containerDiv.innerHTML = formularioHtml;

    const eliminarBtn = document.getElementById('eliminarTransaccion');
    eliminarBtn.addEventListener('click', () => {
        const selectElement = document.getElementById('seleccionCategoria');
        const nombreTransaccionInput = document.getElementById('nombreTransaccion');
        const seleccionCategoria = selectElement.value;
        const tipoTransaccion = gestorTransacciones.devolverTipoTransaccion(seleccionCategoria);
        const nombreTransaccion = nombreTransaccionInput.value;

        gestorTransacciones.eliminarTransaccion(nombreTransaccion, tipoTransaccion);
    });

    const cancelarEliminarBtn = document.getElementById('cancelarEliminarTransaccion');
    cancelarEliminarBtn.addEventListener('click', () => {
        containerDiv.innerHTML = "";
        mostrarMenuPrincipal(gestorTransacciones);
    });
}

function buscarTransaccionSubMenu(gestorTransacciones) {
    const containerDiv = document.querySelector('.container');
    const form = document.createElement('form');
    form.classList.add('row', 'g-3', 'align-items-center', 'justify-content-center', 'mb-4', 'form-floating');
    form.id = 'formularioBuscar';


    const nombreABuscarInput = document.createElement('input');
    nombreABuscarInput.type = 'text';
    nombreABuscarInput.placeholder = 'Nombre de transacción a buscar';
    nombreABuscarInput.classList.add('form-control');

    const buscarBtn = document.createElement('button');
    buscarBtn.textContent = 'Buscar';
    buscarBtn.type = 'submit';
    buscarBtn.classList.add('btn', 'btn-primary');

    const cancelarBtn = document.createElement('button');
    cancelarBtn.textContent = 'Cancelar';
    cancelarBtn.type = 'button';
    cancelarBtn.classList.add('btn', 'btn-danger');

    // Organizar elementos en la rejilla de Bootstrap
    const inputDiv = document.createElement('div');
    inputDiv.classList.add('col-auto');
    inputDiv.appendChild(nombreABuscarInput);

    const buttonDiv = document.createElement('div');
    buttonDiv.classList.add('col-auto');
    buttonDiv.appendChild(buscarBtn);
    buttonDiv.appendChild(cancelarBtn);

    form.appendChild(inputDiv);
    form.appendChild(buttonDiv);

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const nombreABuscar = nombreABuscarInput.value.trim();
        const transaccionesEncontradas = gestorTransacciones.buscarTransaccion(nombreABuscar);

        if (transaccionesEncontradas.length > 0) {
            const detallesTransacciones = transaccionesEncontradas.map(transaccion => {
                return `${transaccion.tipo}: ${transaccion.nombre} - Valor: ${transaccion.valor}`;
            }).join("\n");

            const mensajeDiv = document.createElement('div');
            mensajeDiv.textContent = "Transacciones encontradas:\n" + detallesTransacciones;
            mensajeDiv.classList.add('mensaje');

            containerDiv.appendChild(mensajeDiv);

            setTimeout(() => {
                mensajeDiv.remove();
            }, 3000);
        } else {
            const mensajeDiv = document.createElement('div');
            mensajeDiv.textContent = "No se encontraron transacciones con el nombre '" + nombreABuscar + "'";
            mensajeDiv.classList.add('mensaje');

            containerDiv.appendChild(mensajeDiv);

            setTimeout(() => {
                mensajeDiv.remove();
            }, 3000);
        }
    });

    cancelarBtn.addEventListener('click', function () {
        containerDiv.innerHTML = '';
        mostrarMenuPrincipal(gestorTransacciones);
    });

    containerDiv.innerHTML = '';
    containerDiv.appendChild(form);
}

/* Submenu para filtrar transaccion segun su tipo */
function filtrarTransaccionesSubMenu(gestorTransacciones) {
    const containerDiv = document.querySelector('.container');

    const formularioHtml = `
        <div class="formulario-filtrar d-grid gap-2 justify-content-center align-items-center mb-4">
            <h2>Filtrar transacciones</h2>
            <label for="seleccionCategoriaInput">Seleccione el tipo de transacción:</label>
            <select id="seleccionCategoriaInput" class="form-select mb-3">
                <option value="1">Ingreso</option>
                <option value="2">Gasto</option>
                <option value="3">Ahorro</option>
            </select>
            <label for="valorMinimoInput">Valor mínimo a filtrar:</label>
            <input type="number" id="valorMinimoInput" class="form-control mb-3" placeholder="Ingrese el valor mínimo">
            <label for="valorMaximoInput">Valor máximo a filtrar:</label>
            <input type="number" id="valorMaximoInput" class="form-control mb-3" placeholder="Ingrese el valor máximo">
            <button class="btn btn-primary" id="filtrarBtn">Filtrar</button>
            <button class="btn btn-danger" id="cancelarBtn">Cancelar</button>
        </div>
    `;

    containerDiv.innerHTML = formularioHtml;

    const filtrarBtn = document.getElementById('filtrarBtn');
    const cancelarBtn = document.getElementById('cancelarBtn');

    filtrarBtn.addEventListener('click', function (event) {
        event.preventDefault();

        const seleccionCategoriaInput = document.getElementById('seleccionCategoriaInput');
        const valorMinimoInput = document.getElementById('valorMinimoInput');
        const valorMaximoInput = document.getElementById('valorMaximoInput');

        const seleccionCategoria = seleccionCategoriaInput.value;
        const tipoAFiltrar = gestorTransacciones.devolverTipoTransaccion(seleccionCategoria);

        const valorMinimoAFiltrar = parseFloat(valorMinimoInput.value);
        const valorMaximoAFiltrar = parseFloat(valorMaximoInput.value);

        const transaccionesFiltradas = gestorTransacciones.filtrarTransacciones(tipoAFiltrar, valorMinimoAFiltrar, valorMaximoAFiltrar);

        if (transaccionesFiltradas.length > 0) {
            const mensajeDiv = document.createElement('div');
            mensajeDiv.textContent = "Transacciones filtradas:\n" + transaccionesFiltradas.map(transaccion => `${transaccion.nombre}: ${transaccion.valor}`).join("\n");
            mensajeDiv.classList.add('mensaje');

            containerDiv.appendChild(mensajeDiv);

            setTimeout(() => {
                mensajeDiv.remove();
            }, 3000);
        } else {
            const mensajeDiv = document.createElement('div');
            mensajeDiv.textContent = "No se encontraron transacciones que cumplan con los criterios de filtrado. Es importante completar todos los criterios.";
            mensajeDiv.classList.add('mensaje');

            containerDiv.appendChild(mensajeDiv);

            setTimeout(() => {
                mensajeDiv.remove();
            }, 3000);
        }
    });

    cancelarBtn.addEventListener('click', function () {
        containerDiv.innerHTML = '';
        mostrarMenuPrincipal(gestorTransacciones);
    });
}


/* Submenu para visualizar las transacciones ingresadas en el sistema segun su tipo */
function verTransaccionesSubMenu(gestorTransacciones) {
    const containerDiv = document.querySelector('.container');

    const formularioHtml = `
        <div class="formulario-ver d-grid gap-2 justify-content-center align-items-center mb-4">
            <h2>Ver transacciones</h2>
            <label for="seleccionCategoriaInput">Seleccione el tipo de transacción:</label>
            <select id="seleccionCategoriaInput" class="form-select mb-3">
                <option value="1">Ingreso</option>
                <option value="2">Gasto</option>
                <option value="3">Ahorro</option>
            </select>
            <button class="btn btn-primary" id="verBtn">Ver</button>
            <button class="btn btn-danger" id="cancelarBtn">Cancelar</button>
        </div>
    `;

    containerDiv.innerHTML = formularioHtml;

    const verBtn = document.getElementById('verBtn');
    const cancelarBtn = document.getElementById('cancelarBtn');

    verBtn.addEventListener('click', function (event) {
        event.preventDefault();

        const seleccionCategoriaInput = document.getElementById('seleccionCategoriaInput');
        const seleccionCategoria = seleccionCategoriaInput.value;

        const tipoTransaccion = gestorTransacciones.devolverTipoTransaccion(seleccionCategoria);

        if (gestorTransacciones.hayTransacciones(tipoTransaccion)) {
            const transacciones = gestorTransacciones[tipoTransaccion.toLowerCase() + "s"];
            const transaccionesTexto = transacciones.map(transaccion => `${transaccion.nombre}: ${transaccion.valor}`).join("\n");

            const total = gestorTransacciones.calcularTotalPorTipo(tipoTransaccion);

            const mensajeDiv = document.createElement('div');
            mensajeDiv.textContent = `Todos los ${tipoTransaccion.toLowerCase()}s:\n${transaccionesTexto}\n\nTotal: ${total}`;
            mensajeDiv.classList.add('mensaje');

            containerDiv.appendChild(mensajeDiv);

            setTimeout(() => {
                mensajeDiv.remove();
            }, 3000);
        } else {
            const mensajeDiv = document.createElement('div');
            mensajeDiv.textContent = `No hay ningún ${tipoTransaccion.toLowerCase()} registrado en el sistema.`;
            mensajeDiv.classList.add('mensaje');

            containerDiv.appendChild(mensajeDiv);

            setTimeout(() => {
                mensajeDiv.remove();
            }, 3000);
        }
    });

    cancelarBtn.addEventListener('click', function () {
        containerDiv.innerHTML = '';
        mostrarMenuPrincipal(gestorTransacciones);
    });
}

/* Submenu para salir del sistema */
function salirSubMenu() {
    const containerDiv = document.querySelector('.container');

    const confirmacionDiv = document.createElement('div');
    confirmacionDiv.className = "mb-3";
    confirmacionDiv.innerHTML = `
        <p>¿Está seguro/a que desea salir?</p>
        <button id="siSalirBtn" class="btn btn-primary">Sí</button>
        <button id="noSalirBtn" class="btn btn-danger">No</button>
    `;
    confirmacionDiv.classList.add('confirmacion');

    containerDiv.appendChild(confirmacionDiv);

    const siSalirBtn = document.getElementById('siSalirBtn');
    const noSalirBtn = document.getElementById('noSalirBtn');

    siSalirBtn.addEventListener('click', function () {
        containerDiv.innerHTML = '';
        const textoPorDefecto = `<h2>¿Por qué "Presupuesto360"?</h2>
            <p>En "Presupuesto360", nos preocupamos por tu bienestar financiero. Nuestra calculadora de presupuesto
                mensual te permite administrar tus ingresos y gastos de manera detallada en categorías como vivienda,
                alimentación, transporte y más.</p>

            <h2>¿Qué puedes esperar?</h2>

            <p>Personalización: Ingresa tus ingresos y gastos de manera detallada para obtener un panorama completo de
                tu situación financiera.</p>

            <p>Flexibilidad: Ajusta tu presupuesto según tus necesidades y metas. ¿Planeas una compra importante o unas
                vacaciones? "Presupuesto360" te ayuda a visualizar cómo afectará a tu presupuesto mensual.</p>

            <p>Control Financiero: Obtén un resumen claro de tus finanzas mensuales. "Presupuesto360" calcula
                automáticamente tu presupuesto restante después de tus gastos e ingresos, dándote el control total de
                tus finanzas.</p>
            <h2>Consulta la cotización actual de la moneda</h2>
            <p>Puedes acceder a la información sobre la cotización haciendo click en el siguiente botón:</p>
                <button id="mostrarInfoFinancieraBtn" class="btn btn-primary">Mostrar información de la cotización de la moneda</button>
            <p class="fraseFinal">Comienza hoy mismo a tomar decisiones financieras más inteligentes. "Presupuesto360"
                está aquí para ayudarte a alcanzar tus objetivos financieros!</p>`;

        containerDiv.innerHTML = textoPorDefecto;
        mostrarInfoFinanciera();
    });

    noSalirBtn.addEventListener('click', function () {
        confirmacionDiv.remove();
    });
}

function guardarGestorTransaccionesEnLocalStorage(gestorTransacciones) {
    const gestorTransaccionesString = JSON.stringify(gestorTransacciones);
    localStorage.setItem('gestorTransacciones', gestorTransaccionesString);
}

/************************* */
/* Cargar datos desde jSON */
/************************* */
async function cargarDatosDesdeJSON() {
    try {
        const response = await fetch('../data/datos.json');
        if (!response.ok) {
            throw new Error('Error al cargar los datos');
        }
        const datos = await response.json();
        return datos;
    } catch (error) {
        throw new Error('Error al cargar los datos');
    }
}

/************************************************************************************** */
/********************** API para consultar informacion financiera ***********************/
/* Disponible aqui: https://apilayer.com/marketplace/exchangerates_data-api#rate-limits */
/************************************************************************************** */
function promesaInfoFinanciera() {
    return new Promise((resolve, reject) => {
        const btnMostrarInfoFinanciera = document.getElementById('mostrarInfoFinancieraBtn');

        btnMostrarInfoFinanciera.addEventListener('click', async function () {

            var myHeaders = new Headers();
            myHeaders.append("apikey", "enrJKbc6k4PzVRx8X1OUzOKFnCfEM59v");

            var requestOptions = {
                method: 'GET',
                redirect: 'follow',
                headers: myHeaders
            };

            try {
                const response = await fetch("https://api.apilayer.com/exchangerates_data/latest?symbols=GBP%2CJPY%2CCHF%2CUSD&base=EUR", requestOptions);
                const result = await response.json();

                resolve(result); // Resolvemos la promesa con los datos obtenidos

            } catch (error) {
                console.log('Error:', error);
                reject(error); // Rechazamos la promesa en caso de error
            }
        });
    });
}

function mostrarInfoFinanciera() {

    promesaInfoFinanciera()
        .then(data => {
            // Manejar los datos obtenidos
            let message = "<b>Consulta las cotizaciones respecto al Euro</b><br><br>";
            message += "Últimas actualizaciones de las principales monedas:<br>";
            message += `- GBP: ${data.rates.GBP}<br>`;
            message += `- JPY: ${data.rates.JPY}<br>`;
            message += `- CHF: ${data.rates.CHF}<br>`;
            message += `- USD: ${data.rates.USD}<br>`;

            // Mostrar el mensaje con los datos usando la libreria SweetAlert2
            Swal.fire({
                title: 'Cotizaciones actuales',
                html: message,
                icon: 'info'
            });
        })
        .catch(error => {
            // Mostrar un mensaje de error con libreria SweetAlert2
            Swal.fire({
                title: 'Error',
                text: 'Hubo un error al cargar la información.',
                icon: 'error'
            });
            console.error(error);
        });
}

/*************************** */
/* DOM y eventos del usuario */
/*************************** */
document.addEventListener('DOMContentLoaded', function () {

    mostrarInfoFinanciera();
    const formularioDiv = document.getElementById('formulario');
    const formHtml = `
        <form id="nombreUsuarioForm">
            <input type="text" id="nombreUsuarioInput" class="my-3" placeholder="Ingrese su nombre">
            <button id="comenzarBtn" type="submit" class="btn btn-primary">Comenzar</button>
        </form>
    `;

    formularioDiv.innerHTML = formHtml;

    const nombreUsuarioForm = document.getElementById('nombreUsuarioForm');

    nombreUsuarioForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const nombreUsuarioInput = document.getElementById('nombreUsuarioInput');
        const nombreUsuario = nombreUsuarioInput.value.trim();

        if (nombreUsuario) {
            mensajeBienvenida = `Bienvenido/a ${nombreUsuario} a Presupuesto360`;
            mostrarMensaje(mensajeBienvenida, "bienvenidaUsuario");
            principal();
        } else {
            mostrarMensaje('Por favor, ingrese su nombre.', "noBienvenidaUsuario");
        }
    });
});


function mostrarMensaje(mensaje, id) {

    const mensajeDiv = document.createElement('div');
    mensajeDiv.innerHTML = mensaje;
    mensajeDiv.id = id;
    mensajeDiv.classList.add('mensaje');

    const containerDiv = document.querySelector('.container');
    containerDiv.innerHTML = '';
    containerDiv.appendChild(mensajeDiv);

}

function mostrarMensajeTemporal(mensaje) {
    const containerDiv = document.querySelector('.container');
    const mensajeDiv = document.createElement('div');

    mensajeDiv.innerHTML = mensaje;
    mensajeDiv.classList.add('mensaje');

    containerDiv.innerHTML = '';
    containerDiv.appendChild(mensajeDiv);

    setTimeout(() => {
        containerDiv.innerHTML = '';
    }, 3000);
}