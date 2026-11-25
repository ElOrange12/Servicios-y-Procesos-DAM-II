# Reto relámpago

Aplicación multijugador de preguntas para el módulo 0490 - Programación de servicios y procesos.

## Idea

Varias personas se conectan desde el navegador a un servidor WebSocket. El servidor inicia cinco preguntas comunes, recibe una respuesta por jugador y ronda, controla el tiempo y mantiene la puntuación. Al terminar cada ronda comunica la respuesta correcta y la clasificación actual.

## Archivos

- `servidor.py`: servidor WebSocket asíncrono, estado de la partida, temporizador y puntuación.
- `index.html`: interfaz del cliente y conexión del juego.
- `worker.js`: mantiene el WebSocket y reintenta la conexión si se interrumpe.
- `requirements.txt`: dependencia del servidor.

## Ejecución local

Instala la dependencia y arranca el servidor WebSocket:

```bash
python3 -m pip install -r requirements.txt
python3 servidor.py
```

En otra terminal, sirve los archivos web:

```bash
python3 -m http.server 8000
```

Abre `http://localhost:8000` en dos o más ventanas del navegador, entra con un nombre en cada una y pulsa **Empezar partida**. El servidor escucha por defecto en el puerto `8765`; se puede cambiar con las variables `HOST` y `PORT`.

## Comunicación y sincronización

El navegador envía mensajes JSON (`entrar`, `iniciar` y `respuesta`) y recibe eventos (`pregunta`, `resultado`, `jugadores` y `final`). Python `asyncio` atiende varias conexiones sin bloquearse esperando a un único jugador. Una tarea controla la duración de cada ronda y un `asyncio.Event` permite avanzar cuando todos los jugadores conectados ya han respondido. El diccionario `clientes` asocia cada conexión con su nombre y puntos.

## Relación con los ejercicios

El proyecto combina el servidor WebSocket que recibe y difunde mensajes, el manejo de clientes simultáneos y la separación entre cliente y servidor practicados en esta carpeta. La mecánica de preguntas sirve como ejemplo nuevo de transmisión bidireccional de información en tiempo real.
