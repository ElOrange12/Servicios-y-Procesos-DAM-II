import asyncio
import json
import os
import time
import uuid

from websockets.asyncio.server import serve

HOST = os.getenv("HOST", "0.0.0.0")
PUERTO = int(os.getenv("PORT", "8765"))
TIEMPO_RONDA = 15
TIEMPO_RESULTADO = 4

preguntas = [
    {"texto": "¿Qué protocolo se utiliza para enviar páginas web?", "opciones": ["HTTP", "FTP", "SMTP", "SSH"], "correcta": 0},
    {"texto": "¿Qué función de Python espera una conexión entrante?", "opciones": ["listen()", "accept()", "connect()", "sendall()"], "correcta": 1},
    {"texto": "¿Qué dirección representa al propio equipo?", "opciones": ["8.8.8.8", "192.168.1.1", "127.0.0.1", "255.255.255.0"], "correcta": 2},
    {"texto": "¿Qué método de WebSocket envía un mensaje?", "opciones": ["postMessage()", "emit()", "write()", "send()"], "correcta": 3},
    {"texto": "¿Qué módulo de Python permite crear sockets TCP?", "opciones": ["socket", "asyncio", "threading", "sqlite3"], "correcta": 0},
]

clientes = {}
partida = {"activa": False, "indice": -1, "pregunta": None, "numero_ronda": 0, "respuestas": {}, "fin": 0}
evento_respuestas = None
tarea_partida = None


def mensaje_json(mensaje):
    return json.dumps(mensaje, ensure_ascii=False, separators=(",", ":"))


async def enviar(websocket, mensaje):
    try:
        await websocket.send(mensaje_json(mensaje))
        return True
    except Exception:
        return False


async def difundir(mensaje):
    if not clientes:
        return
    destinatarios = list(clientes)
    resultados = await asyncio.gather(
        *(enviar(websocket, mensaje) for websocket in destinatarios),
        return_exceptions=True
    )
    for websocket, resultado in zip(destinatarios, resultados):
        if resultado is not True:
            clientes.pop(websocket, None)


def clasificacion():
    return sorted(
        ({"nombre": datos["nombre"], "puntos": datos["puntos"]} for datos in clientes.values()),
        key=lambda jugador: (-jugador["puntos"], jugador["nombre"].casefold())
    )


def estado_actual():
    estado = {"tipo": "estado", "jugadores": clasificacion(), "activa": partida["activa"]}
    if partida["activa"]:
        pregunta = partida["pregunta"]
        estado.update({
            "numero_ronda": partida["numero_ronda"],
            "total_rondas": len(preguntas),
            "texto": pregunta["texto"],
            "opciones": pregunta["opciones"],
            "segundos": max(0, round(partida["fin"] - time.monotonic()))
        })
    return estado


async def cerrar_ronda(numero_ronda):
    if not partida["activa"] or partida["numero_ronda"] != numero_ronda:
        return
    partida["activa"] = False
    correcta = partida["pregunta"]["correcta"]
    respuestas = partida["respuestas"]
    for websocket, indice in respuestas.items():
        if indice == correcta and websocket in clientes:
            clientes[websocket]["puntos"] += 1
    await difundir({
        "tipo": "resultado",
        "correcta": correcta,
        "respuestas": [
            {"id": clientes[websocket]["id"], "nombre": clientes[websocket]["nombre"], "opcion": indice}
            for websocket, indice in respuestas.items() if websocket in clientes
        ],
        "jugadores": clasificacion(),
        "numero_ronda": numero_ronda,
        "total_rondas": len(preguntas)
    })


async def jugar():
    global evento_respuestas
    for indice, pregunta in enumerate(preguntas):
        partida.update({
            "activa": True,
            "indice": indice,
            "pregunta": pregunta,
            "numero_ronda": indice + 1,
            "respuestas": {},
            "fin": time.monotonic() + TIEMPO_RONDA
        })
        evento_respuestas = asyncio.Event()
        await difundir({
            "tipo": "pregunta",
            "numero_ronda": indice + 1,
            "total_rondas": len(preguntas),
            "texto": pregunta["texto"],
            "opciones": pregunta["opciones"],
            "segundos": TIEMPO_RONDA
        })
        try:
            await asyncio.wait_for(evento_respuestas.wait(), timeout=TIEMPO_RONDA)
        except asyncio.TimeoutError:
            pass
        await cerrar_ronda(indice + 1)
        await asyncio.sleep(TIEMPO_RESULTADO)

    partida["activa"] = False
    await difundir({"tipo": "final", "jugadores": clasificacion()})


async def manejar_cliente(websocket):
    identificador = uuid.uuid4().hex[:12]
    nombre = None
    print("Cliente conectado:", websocket.remote_address)

    try:
        async for bruto in websocket:
            if not isinstance(bruto, str) or len(bruto) > 2048:
                continue
            try:
                mensaje = json.loads(bruto)
            except (ValueError, TypeError):
                continue
            if not isinstance(mensaje, dict):
                continue

            if nombre is None:
                if mensaje.get("tipo") != "entrar":
                    continue
                nombre_recibido = mensaje.get("nombre", "")
                if not isinstance(nombre_recibido, str):
                    continue
                nombre_recibido = nombre_recibido.strip()
                if not 1 <= len(nombre_recibido) <= 20 or any(ord(c) < 32 for c in nombre_recibido):
                    await enviar(websocket, {"tipo": "error", "texto": "El nombre debe tener entre 1 y 20 caracteres."})
                    continue
                nombre = nombre_recibido
                clientes[websocket] = {"id": identificador, "nombre": nombre, "puntos": 0}
                estado = estado_actual()
                estado["tipo"] = "bienvenida"
                estado["id"] = identificador
                await enviar(websocket, estado)
                await difundir({"tipo": "jugadores", "jugadores": clasificacion()})
                print("Jugador conectado:", nombre)
                continue

            if mensaje.get("tipo") == "iniciar":
                global tarea_partida
                if tarea_partida is None or tarea_partida.done():
                    for datos in clientes.values():
                        datos["puntos"] = 0
                    tarea_partida = asyncio.create_task(jugar())
                    await difundir({"tipo": "jugadores", "jugadores": clasificacion()})

            elif mensaje.get("tipo") == "respuesta" and partida["activa"]:
                opcion = mensaje.get("opcion")
                if type(opcion) is int and 0 <= opcion < len(partida["pregunta"]["opciones"]):
                    partida["respuestas"].setdefault(websocket, opcion)
                    await enviar(websocket, {"tipo": "confirmacion"})
                    if all(jugador in partida["respuestas"] for jugador in clientes):
                        evento_respuestas.set()

    except Exception:
        pass
    finally:
        datos = clientes.pop(websocket, None)
        if datos:
            print("Jugador desconectado:", datos["nombre"])
            await difundir({"tipo": "jugadores", "jugadores": clasificacion()})
            if partida["activa"] and all(jugador in partida["respuestas"] for jugador in clientes):
                evento_respuestas.set()


async def main():
    print(f"Servidor de preguntas WebSocket iniciado en ws://{HOST}:{PUERTO}")
    async with serve(manejar_cliente, HOST, PUERTO, max_size=2048, ping_interval=20):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
