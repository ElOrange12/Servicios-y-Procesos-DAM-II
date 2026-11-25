'use strict';

let socket = null;
let url = '';
let nombre = '';
let reconexion = null;
let parar = false;

function avisar(tipo, datos = {}) {
  self.postMessage({ tipo, ...datos });
}

function conectar() {
  if (parar || !url) return;
  socket = new WebSocket(url);

  socket.onopen = function () {
    avisar('conexion', { conectada: true });
    socket.send(JSON.stringify({ tipo: 'entrar', nombre }));
  };

  socket.onclose = function () {
    avisar('conexion', { conectada: false });
    if (!parar) reconexion = setTimeout(conectar, 1800);
  };

  socket.onerror = function () {
    socket.close();
  };

  socket.onmessage = function (evento) {
    try {
      const mensaje = JSON.parse(evento.data);
      if (mensaje && typeof mensaje.tipo === 'string') avisar('mensaje', { mensaje });
    } catch (error) {
      avisar('error', { texto: 'El servidor envió un mensaje que no se pudo leer.' });
    }
  };
}

self.onmessage = function (evento) {
  const orden = evento.data;
  if (orden.tipo === 'conectar') {
    nombre = orden.nombre;
    url = orden.url;
    parar = false;
    conectar();
  } else if (orden.tipo === 'enviar' && socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(orden.mensaje));
  } else if (orden.tipo === 'desconectar') {
    parar = true;
    clearTimeout(reconexion);
    if (socket) socket.close();
  }
};
