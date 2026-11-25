const selectorArchivo = document.querySelector("#archivo");
const selectorFiltro = document.querySelector("#filtro");
const selectorTrabajadores = document.querySelector("#numero-trabajadores");
const botonProcesar = document.querySelector("#procesar");
const barraProgreso = document.querySelector("#progreso");
const textoEstado = document.querySelector("#estado");
const lienzoOriginal = document.querySelector("#original");
const lienzoResultado = document.querySelector("#resultado");
const contextoOriginal = lienzoOriginal.getContext("2d", { willReadFrequently: true });
const contextoResultado = lienzoResultado.getContext("2d");
const maximoTrabajadores = Math.max(1, Math.min(navigator.hardwareConcurrency || 2, 8));
let imagenCargada = false;
let ejecucion = 0;

for (let numero = 1; numero <= maximoTrabajadores; numero++) {
  const opcion = document.createElement("option");
  opcion.value = numero;
  opcion.textContent = numero === 1 ? "1 trabajador" : `${numero} trabajadores`;
  selectorTrabajadores.append(opcion);
}
selectorTrabajadores.value = maximoTrabajadores;

selectorArchivo.addEventListener("change", cargarImagen);
botonProcesar.addEventListener("click", procesarImagen);

function cargarImagen() {
  const archivo = selectorArchivo.files[0];
  if (!archivo) return;
  const url = URL.createObjectURL(archivo);
  const imagen = new Image();
  imagen.onload = function () {
    const escala = Math.min(1, 2400 / imagen.width, 2400 / imagen.height);
    const ancho = Math.max(1, Math.round(imagen.width * escala));
    const alto = Math.max(1, Math.round(imagen.height * escala));
    lienzoOriginal.width = ancho;
    lienzoOriginal.height = alto;
    lienzoResultado.width = ancho;
    lienzoResultado.height = alto;
    contextoOriginal.drawImage(imagen, 0, 0, ancho, alto);
    contextoResultado.clearRect(0, 0, ancho, alto);
    imagenCargada = true;
    botonProcesar.disabled = false;
    barraProgreso.value = 0;
    textoEstado.textContent = `Imagen cargada: ${ancho} × ${alto}.`;
    URL.revokeObjectURL(url);
  };
  imagen.onerror = function () {
    textoEstado.textContent = "No se ha podido abrir ese archivo como imagen.";
    URL.revokeObjectURL(url);
  };
  imagen.src = url;
}

function procesarImagen() {
  if (!imagenCargada) return;
  const idEjecucion = ++ejecucion;
  botonProcesar.disabled = true;
  barraProgreso.value = 0;
  textoEstado.textContent = "Preparando bloques de píxeles…";

  const ancho = lienzoOriginal.width;
  const alto = lienzoOriginal.height;
  const imagen = contextoOriginal.getImageData(0, 0, ancho, alto);
  const numeroTrabajadores = Math.min(Number(selectorTrabajadores.value), alto);
  const filtro = selectorFiltro.value;
  const bloques = [];
  let terminados = 0;
  let sumaBrillo = 0;
  const inicio = performance.now();

  for (let indice = 0; indice < numeroTrabajadores; indice++) {
    const filaInicio = Math.floor(indice * alto / numeroTrabajadores);
    const filaFin = Math.floor((indice + 1) * alto / numeroTrabajadores);
    const desde = filaInicio * ancho * 4;
    const hasta = filaFin * ancho * 4;
    const datos = imagen.data.slice(desde, hasta);
    const trabajador = new Worker("trabajador.js");

    trabajador.onmessage = function (evento) {
      const respuesta = evento.data;
      trabajador.terminate();
      if (idEjecucion !== ejecucion) return;
      if (respuesta.error) {
        textoEstado.textContent = `Error en un trabajador: ${respuesta.error}`;
        botonProcesar.disabled = false;
        return;
      }
      bloques[respuesta.filaInicio] = new Uint8ClampedArray(respuesta.pixeles);
      sumaBrillo += respuesta.sumaBrillo;
      terminados++;
      barraProgreso.value = terminados / numeroTrabajadores * 100;
      textoEstado.textContent = `Bloques completados: ${terminados} de ${numeroTrabajadores}.`;

      if (terminados === numeroTrabajadores) {
        const salida = contextoResultado.createImageData(ancho, alto);
        for (const fila of Object.keys(bloques).map(Number)) {
          salida.data.set(bloques[fila], fila * ancho * 4);
        }
        contextoResultado.putImageData(salida, 0, 0);
        const segundos = (performance.now() - inicio) / 1000;
        document.querySelector("#pixeles").textContent = (ancho * alto).toLocaleString("es-ES");
        document.querySelector("#tiempo").textContent = `${segundos.toFixed(3)} s`;
        document.querySelector("#trabajadores-usados").textContent = String(numeroTrabajadores);
        document.querySelector("#brillo").textContent = (sumaBrillo / (ancho * alto)).toFixed(1);
        textoEstado.textContent = `Proceso terminado en ${segundos.toFixed(3)} segundos.`;
        botonProcesar.disabled = false;
      }
    };
    trabajador.onerror = function (evento) {
      trabajador.terminate();
      if (idEjecucion !== ejecucion) return;
      textoEstado.textContent = `Error al iniciar el trabajador: ${evento.message || "error desconocido"}`;
      botonProcesar.disabled = false;
    };
    trabajador.postMessage({ filaInicio, filtro, pixeles: datos.buffer }, [datos.buffer]);
  }
}
