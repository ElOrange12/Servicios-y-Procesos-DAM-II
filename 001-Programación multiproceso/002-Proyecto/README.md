# Laboratorio de imagen multiproceso

Proyecto para el módulo 0490 - Programación de servicios y procesos.

## Idea

La aplicación aplica un filtro a una imagen y calcula el brillo medio de sus píxeles. El proceso principal divide la imagen en bloques de filas y crea varios Web Workers. Cada trabajador procesa su bloque de forma independiente y devuelve el bloque transformado junto con la suma de brillo. El proceso principal reúne los resultados en el orden correcto y actualiza el canvas.

## Archivos

- `index.html`: controles, canvas y resumen de resultados.
- `estilos.css`: presentación adaptable a pantallas pequeñas.
- `app.js`: carga la imagen, crea trabajadores, reparte los rangos y sincroniza las respuestas.
- `trabajador.js`: calcula el filtro y las estadísticas de su bloque.

## Ejecución

Desde esta carpeta, inicia un servidor web local:

```bash
python3 -m http.server 8000
```

Abre `http://localhost:8000` en el navegador, carga una imagen, selecciona filtro y número de trabajadores y pulsa **Procesar imagen**. El límite de trabajadores se ajusta al número de procesadores que informa el navegador, con un máximo de ocho.

## Paralelismo y comunicación

Cada trabajador tiene un rango de filas distinto, por lo que no escribe sobre el bloque de otro trabajador. El proceso principal envía los píxeles con `postMessage` y transfiere el `ArrayBuffer` para evitar copiarlo durante el envío. Cada respuesta incluye la fila inicial, los píxeles modificados y una suma parcial. Un contador de respuestas sincroniza la finalización; al llegar todas, el programa calcula el brillo medio y dibuja la imagen completa.

Se puede comparar el coste de usar uno o varios trabajadores con la misma imagen. La medida incluye el envío de datos y la espera de respuestas, por lo que puede variar según el navegador, el tamaño de la imagen y el equipo.

## Relación con los ejercicios

La estructura y las técnicas parten de los ejercicios de Web Workers y canvas de `001-Ejercicios/001-Ejecutables. Procesos. Servicios` (creación de trabajadores, envío de mensajes y reparto en array) y del trabajo por bloques y análisis de datos desarrollado en los ejercicios posteriores de la carpeta. El resultado añade una aplicación completa para visualizar el reparto y la sincronización.
