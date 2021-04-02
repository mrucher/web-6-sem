const express = require('express')
const fetch = require("node-fetch")
const app = express()
const port = 3000

let allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Headers', "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    next();
}
app.use(allowCrossDomain);

const promise = require('bluebird');

const initOptions = {
    promiseLib: promise
};

let pgp = require("pg-promise")(initOptions);
let db = pgp("postgres://postgres:syDRIk@localhost:5432/weatherDB");

const selectByCity = (city) => {
    return `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=40b59a908fc6450e086253153b78d13e&lang=ru`
}

const selectByCoords = (lat, lon) => {
    return `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=40b59a908fc6450e086253153b78d13e&lang=ru`
}

app.get('/weather/city', (request, response) => {
    const city = request.query['q'];
    fetch(selectByCity(encodeURIComponent(city)))
        .then(response => response.json())
        .then(data => {
            response.send(data);
        })
        .catch(error => {
            console.log("favorites get fail")
            res.status(500).send("Internal error");
        });
})

app.get('/weather/coordinates', (request, response) => {
    const lat = request.query['lat'];
    const lon = request.query['lon'];
    fetch(selectByCoords(lat, lon))
        .then(response => response.json())
        .then(data => {
            response.send(data);
        })
        .catch(error => {
            console.log("favorites get fail")
            res.status(500).send("Internal error");
        });
})

app.get('/features', async (request, response) => {
    //let ip = parseIp(request);
    // if (ip) {
    let cities = await db.any('SELECT city FROM favorites');
    response.send(Array.prototype.map.call(cities, el => el['city']));
    // }
})

app.post('/features', async (request, response) => {
    let city = request.query['city'];
    let cities = await db.any('SELECT city FROM favorites WHERE city=$1', [city]);
    if (cities.length === 1){
        response.status(300).send("This city already in favorites");

    }
    else {
        await db.none('INSERT INTO favorites(city) VALUES($1)', [city]);
        response.status(200).send(city);
    }

})

app.delete('/features', async (request, response) => {
    let city = request.query['city'];
    if (city) {
        await db.none('DELETE FROM favorites WHERE id IN (' +
            'SELECT id FROM favorites WHERE city=$1 LIMIT 1)', [city]);
        response.send(city);
    }
})

app.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }
    console.log(`server is listening on ${port}`)
})