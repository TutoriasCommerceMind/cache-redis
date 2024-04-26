const express = require("express");
const axios = require("axios");
const redis = require("redis");

const puerto = 3000;
const app = express();

// Crear cliente Redis

const redisClient = redis.createClient({ url: "redis://localhost:6379" });

redisClient.on("error", (err) =>
  console.log("Error en el cliente de Redis", err)
);

// Ruta para obtener datos con redis

app.get("/con-redis", (req, res) => {
  redisClient
    .get("rockets") // Obtenemos los datos de Redis
    .then((data) => {
      if (data) { // Si REDIS tiene DATA usamos la data de REDIS
        console.log("Usando datos en CACHE"); 
        return res.json({ data: JSON.parse(data) });
      }

      return axios
        .get("https://api.spacexdata.com/v4/rockets") //Obtenemos dato de la api
        .then((response) => {
          redisClient
            .set("rockets", JSON.stringify(response.data)) // GUARDAMOS LOS DATOS PARA FUTURAS SOLICITUDES
            .then((dataRedis) => {
              console.log("Nuevos datos en cache", dataRedis); // Confirmamos que se guardaron
            })
            .catch((error) => console.log("Error al guardar en Redis", error));
          return res.json({ data: response.data }); // Enviamos los datos de la api al cliente
        })
        .catch((error) => {
          console.log("Error al obtener los datos de la API");
          return res
            .status(500)
            .json({ message: "Error interno en el server" });
        });
    })
    .catch((error) => {
      console.log("Error al obtener los datos de Redis", error);
      return res.status(500).json({ message: "Error interno del server" });
    });
});

// Ruta para obtener datos sin Redis

app.get("/sin-redis", (req, res) => {
  axios
    .get("https://api.spacexdata.com/v4/rockets") //Se hace una solicitud a la pi
    .then((response) => {
      return res.json({ data: response.data }); // Se muestran los resultados
    })
    .catch((error) => {
      console.log("Error al obtener datos de la api", error);
      return res.status(500).json({ message: "Error interno del sv" });
    });
});

// Conectar a Redis y activar el server.

redisClient
  .connect()
  .then(() => {
    console.log("Redis funcionando");
    app.listen(puerto, () => {
      console.log("Servidor en puerto " + puerto);
    });
  })
  .catch((error) => {
    console.log("Error al conectar con redis", error);
  });
