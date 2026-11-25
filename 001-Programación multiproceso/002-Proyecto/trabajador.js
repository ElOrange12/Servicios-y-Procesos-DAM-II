onmessage = function (evento) {
  const datos = evento.data;
  const pixeles = new Uint8ClampedArray(datos.pixeles);
  let sumaBrillo = 0;

  try {
    for (let posicion = 0; posicion < pixeles.length; posicion += 4) {
      const rojo = pixeles[posicion];
      const verde = pixeles[posicion + 1];
      const azul = pixeles[posicion + 2];
      const gris = 0.299 * rojo + 0.587 * verde + 0.114 * azul;
      sumaBrillo += gris;

      if (datos.filtro === "grises") {
        pixeles[posicion] = gris;
        pixeles[posicion + 1] = gris;
        pixeles[posicion + 2] = gris;
      } else if (datos.filtro === "invertir") {
        pixeles[posicion] = 255 - rojo;
        pixeles[posicion + 1] = 255 - verde;
        pixeles[posicion + 2] = 255 - azul;
      } else if (datos.filtro === "sepia") {
        pixeles[posicion] = Math.min(255, 0.393 * rojo + 0.769 * verde + 0.189 * azul);
        pixeles[posicion + 1] = Math.min(255, 0.349 * rojo + 0.686 * verde + 0.168 * azul);
        pixeles[posicion + 2] = Math.min(255, 0.272 * rojo + 0.534 * verde + 0.131 * azul);
      }
    }
    postMessage({ filaInicio: datos.filaInicio, pixeles: pixeles.buffer, sumaBrillo }, [pixeles.buffer]);
  } catch (error) {
    postMessage({ error: error.message });
  }
};
