const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let jsonData = {};  // Almacena temporalmente el archivo .json

app.use(bodyParser.json());

wss.on('connection', (ws) => {
  ws.send(JSON.stringify(jsonData));  // Envía el archivo .json inicial al nuevo cliente

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    jsonData = deepMerge(jsonData, data);  // Actualiza el archivo .json en el servidor fusionando los datos

    console.log('received: update', JSON.stringify(jsonData, null, 2));
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(jsonData));  // Envía actualizaciones a otros clientes
      }
    });
  });
});

app.post('/save', (req, res) => {
  // Endpoint para guardar el archivo .json en la base de datos o sistema de archivos
  jsonData = deepMerge(jsonData, req.body);
  // Aquí podrías guardar jsonData en una base de datos
  res.status(200).send('JSON data saved successfully');
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log('Server is listening on port 3001');
});

// Función para fusionar profundamente dos objetos y arrays
function deepMerge(target, source) {
  const isObject = (obj) => obj && typeof obj === 'object';

  if (!isObject(target) || !isObject(source)) {
    return source;
  }

  Object.keys(source).forEach(key => {
    const targetValue = target[key];
    const sourceValue = source[key];

    if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      target[key] = [...targetValue, ...sourceValue];  // Fusiona arrays en lugar de reemplazar
    } else if (isObject(targetValue) && isObject(sourceValue)) {
      target[key] = deepMerge(targetValue, sourceValue);
    } else {
      target[key] = sourceValue;
    }
  });

  return target;
}
