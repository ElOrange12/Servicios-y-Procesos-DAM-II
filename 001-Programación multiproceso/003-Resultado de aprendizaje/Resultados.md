# Resultado de aprendizaje 1

## Resultado de aprendizaje

Desarrolla aplicaciones compuestas por varios procesos reconociendo y aplicando principios de programación paralela.

### Criterios de evaluación
a) Se han reconocido las características de la programación concurrente y sus ámbitos de aplicación.

En las carpetas de ejecutables y programación concurrente se contrasta la ejecución secuencial bloqueante con el uso no bloqueante de Web Workers. Esto permite aplicar la concurrencia en ámbitos prácticos como el renderizado gráfico en tiempo real y simulaciones físicas complejas.

b) Se han identificado las diferencias entre programación paralela y programación distribuida, sus ventajas e inconvenientes.

Se diferencia el paralelismo local multihilo, limitado por el hardware pero de baja latencia, frente a los sistemas distribuidos maestro-esclavo desarrollados en PHP y JavaScript. Estos últimos escalan horizontalmente repartiendo tareas por red, aunque exigen gestionar latencias y posibles fallos.

c) Se han analizado las características de los procesos y de su ejecución por el sistema operativo.

Mediante ejecutables compilados en C++ y simulaciones de bloques de trabajo, se analiza cómo el sistema operativo asigna CPU a los procesos. Además, se implementan distintas estrategias de planificación secuencial, en espiral y aleatoria para gestionar estados de espera y ejecución.

d) Se han caracterizado los hilos de ejecución y descrito su relación con los procesos.

Se demuestra la relación entre proceso e hilo instanciando múltiples Web Workers secundarios dentro del proceso principal del navegador para no bloquear la interfaz. Asimismo, en C++ se utiliza OpenMP para bifurcar un mismo proceso en varios hilos de ejecución.

e) Se han utilizado clases para programar aplicaciones que crean subprocesos.

Se emplea la clase estándar `Worker` de JavaScript para instanciar dinámicamente pools de subprocesos almacenados en arrays y repartir la carga entre núcleos. Complementariamente, desde Python se orquestan subprocesos externos para invocar modelos de inteligencia artificial y binarios compilados en C++.

f) Se han utilizado mecanismos para compartir información con los subprocesos iniciados.

Para compartir información entre hilos se utilizan dos mecanismos principales: el paso de mensajes serializados mediante `postMessage` para transferir bloques de píxeles, y la memoria compartida mediante `SharedArrayBuffer` y `Float32Array`, permitiendo acceso directo sin sobrecoste de copia.

g) Se han utilizado mecanismos para sincronizar y obtener el valor devuelto por los subprocesos iniciados.

La obtención de resultados se gestiona devolviendo bloques procesados mediante eventos `onmessage` para asignar nuevas tareas dinámicamente. Para sincronizar los hilos se emplean barreras mediante contadores de finalización, particionado estricto de rangos en memoria compartida y bases de datos SQLite.

h) Se han desarrollado aplicaciones que gestionen y utilicen procesos para la ejecución de varias tareas en paralelo.

Se han desarrollado aplicaciones paralelas completas como un editor gráfico con nueve filtros, un simulador físico de miles de partículas con rejilla espacial, procesamiento acelerado de imágenes con OpenCV en C++ y un sistema distribuido para generar vectores semánticos.

i) Se han depurado y documentado las aplicaciones desarrolladas.

La depuración se realiza registrando tiempos de ejecución, fotogramas por segundo, trazas de compilación en terminal y tablas específicas de errores en SQLite. La documentación se estructura mediante código comentado incrementalmente, archivos Markdown explicativos y reportes automáticos de arquitectura y datos.
