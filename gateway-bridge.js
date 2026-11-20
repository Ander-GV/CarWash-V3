/**
 * AUTOWASH PRIME V3 - LOCAL IOT GATEWAY BRIDGE
 * 
 * Script local conectado por USB (COM3) al ESP32.
 * Enlaza el servidor en Azure con el hardware mediante WebSockets y Serial UART.
 * 
 * Ejecucion:
 *   node gateway-bridge.js
 */

const path = require('path');
module.paths.push(path.resolve(__dirname, 'frontend-react', 'node_modules'));
module.paths.push(path.resolve(__dirname, 'backend-nest', 'node_modules'));

const { io } = require('socket.io-client');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const AZURE_BACKEND_URL = process.env.AZURE_URL || 'http://48.216.240.130';
const COM_PORT_NAME = process.env.COM_PORT || 'COM3';
const BAUDRATE = 115200;

console.log('========================================================');
console.log('  AUTOWASH PRIME V3 - PUENTE IOT AZURE <-> HARDWARE     ');
console.log('========================================================');
console.log(`[PUENTE] Conectando con Backend en: ${AZURE_BACKEND_URL}`);
console.log(`[PUENTE] Abriendo puerto serial: ${COM_PORT_NAME} (${BAUDRATE} baudios)...`);

// 1. Abrir puerto Serial con el ESP32
const port = new SerialPort({
  path: COM_PORT_NAME,
  baudRate: BAUDRATE,
  autoOpen: true,
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

port.on('open', () => {
  console.log(`[OK] [SERIAL] Conexion USB establecida con ESP32 en ${COM_PORT_NAME}`);
});

port.on('error', (err) => {
  console.error(`[ERROR] [SERIAL]: ${err.message}`);
});

// 2. Conectar por WebSockets con Azure
const socket = io(`${AZURE_BACKEND_URL}/wash-stream`, {
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
  console.log(`[OK] [AZURE WEBSOCKET] Conectado exitosamente con Azure (Socket ID: ${socket.id})`);
  socket.emit('subscribe_admin_live');
});

socket.on('disconnect', () => {
  console.warn('[WARN] [AZURE WEBSOCKET] Desconectado del servidor Azure. Reconectando...');
});

socket.on('connect_error', (err) => {
  console.warn(`[WARN] [AZURE WEBSOCKET ERROR]: ${err.message}`);
});

let isWashInProgress = false;
let lastSessionId = '';

const triggerWash = (sessionId, origin) => {
  if (isWashInProgress) {
    console.log(`[INFO] [IGNORADO]: Lavado ya en curso fisico. (Origen: ${origin})`);
    return;
  }
  if (!sessionId || sessionId === lastSessionId) {
    return;
  }

  isWashInProgress = true;
  lastSessionId = sessionId;
  console.log(`\n========================================================`);
  console.log(`[ORDEN] [AZURE]: INICIAR LAVADO RECIBIDO DESDE LA WEB`);
  console.log(`   Sesion: ${sessionId} | Origen: ${origin}`);
  console.log(`========================================================`);

  if (port.isOpen) {
    port.write(`CMD:START_WASH:${sessionId}:FULL_WASH\n`);
  } else {
    console.warn(`[WARN] [PUERTO CERRADO]: No se pudo enviar la orden a ${COM_PORT_NAME}.`);
    isWashInProgress = false;
    lastSessionId = '';
  }

  setTimeout(() => {
    if (isWashInProgress) {
      console.log('[WATCHDOG]: Tiempo de lavado transcurrido. Sistema liberado para nuevo vehiculo.\n');
      isWashInProgress = false;
      lastSessionId = '';
    }
  }, 24000);
};

// 3. Ordenes recibidas desde la web hacia el ESP32
socket.on('admin_command', (cmd) => {
  console.log(`[COMANDO] [AZURE]: ${cmd}`);
  if (cmd.startsWith('CMD:START_WASH')) {
    const parts = cmd.split(':');
    const sId = parts[2] || `SESION-${Date.now()}`;
    triggerWash(sId, 'admin_command');
  } else if (cmd.includes('STOP') || cmd.includes('EMERGENCY')) {
    console.log('[EMERGENCIA] [AZURE -> ESP32]: PARADA DE EMERGENCIA RECIBIDA. Deteniendo todo...');
    isWashInProgress = false;
    if (port.isOpen) {
      port.write('p\nCMD:EMERGENCY_STOP\n');
    }
  } else if (cmd.includes('RESUME')) {
    console.log('[INFO] [AZURE -> ESP32]: REANUDAR Y CONTINUAR SISTEMA');
    isWashInProgress = true;
    if (port.isOpen) {
      port.write('CMD:RESUME\n');
      port.write('r\n');
    }
  } else if (port.isOpen) {
    port.write(`${cmd}\n`);
  }
});

socket.on('start_wash_order', (data) => {
  if (data?.sessionId) {
    triggerWash(data.sessionId, 'start_wash_order');
  }
});

socket.on('emergency_stop_triggered', () => {
  console.log('[EMERGENCIA] [AZURE -> ESP32]: PARADA DE EMERGENCIA RECIBIDA');
  isWashInProgress = false;
  if (port.isOpen) {
    port.write('p\nCMD:EMERGENCY_STOP\n');
  }
});

socket.on('system_resumed', () => {
  console.log('[INFO] [AZURE -> ESP32]: REANUDAR Y CONTINUAR SISTEMA');
  isWashInProgress = true;
  if (port.isOpen) {
    port.write('CMD:RESUME\n');
    port.write('r\n');
  }
});

socket.on('stage_updated', (data) => {
  if (data?.sessionId && data.sessionId !== lastSessionId && (data.stage === 'STAGE_STARTING' || data.stage === 'STAGE_SHAMPOO')) {
    triggerWash(data.sessionId, 'stage_updated');
  }
});

socket.on('admin_session_stage_updated', (data) => {
  if (data?.sessionId && data.sessionId !== lastSessionId && (data.stage === 'STAGE_STARTING' || data.stage === 'STAGE_SHAMPOO')) {
    triggerWash(data.sessionId, 'admin_session_stage_updated');
  }
});

// 4. Reportes fisicos desde el ESP32 hacia Azure
parser.on('data', (line) => {
  const cleanLine = line.trim();
  console.log(`[TELEMETRIA] [ESP32 -> AZURE]: ${cleanLine}`);

  if (
    cleanLine.startsWith('EVENT_FINISHED') || 
    cleanLine.includes('STAGE_FINISHED') || 
    cleanLine === 'LOC:INICIO:0' ||
    cleanLine.includes('CICLO COMPLETO TERMINADO')
  ) {
    if (isWashInProgress) {
      isWashInProgress = false;
      console.log(`[FIN] [ESP32]: Ciclo completado (Sesion: ${lastSessionId}). Sistema listo para el proximo vehiculo.\n`);
    }
  }

  if (cleanLine.includes('EVENT_STOPPED') || cleanLine.includes('BLOQUEADO_POR_EMERGENCIA')) {
    isWashInProgress = false;
    console.log(`[PARADA] [ESP32]: Confirmada Parada de Emergencia fisica. Actuadores apagados.`);
  }

  if (cleanLine.startsWith('LOC:')) {
    const parts = cleanLine.split(':');
    socket.emit('vehicle_location', {
      location: parts[1],
      percent: parseInt(parts[2] || '0', 10),
      timestamp: new Date().toISOString(),
    });
  } else if (cleanLine.startsWith('STAGE_CHANGE:')) {
    const parts = cleanLine.split(':');
    socket.emit('stage_change_event', {
      stage: parts[1],
      sessionId: parts[2],
      timestamp: new Date().toISOString(),
    });
  } else if (cleanLine.startsWith('EVENT_FINISHED:')) {
    socket.emit('wash_finished_event', {
      raw: cleanLine,
      timestamp: new Date().toISOString(),
    });
  }
});
