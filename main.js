const APIkey = '37bd4ca0f62d2c9a0f676fc5e70d934d';
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';
const cityListForm = document.forms['add-city'];
const refreshButton = document.getElementsByClassName('update')[0];
const citiesList = document.getElementsByClassName('city-list')[0];
const currentCity = document.getElementsByClassName('current_info')[0];
const cityStorage = window.localStorage;


cityListForm.addEventListener('submit', function (e) {
    const cityInput = document.getElementById('favorite-city-name');
    addCityToUI(cityInput.value);
    cityInput.value = '';
    e.preventDefault();
});

citiesList.addEventListener('click', function (event) {
    if (event.target.className.includes('close-button')) {
      const cityId = event.target.closest('li').id.split('_')[1];
      const cityName = event.target.closest('li').getElementsByClassName('city-name')[0].textContent;
      deleteCityById(cityId);
      cityStorage.removeItem(cityName);
    }
    return;
});

refreshButton.addEventListener('click', function () {
    setLoaderOnCurrentCity();
    loadCurrentCityData();
});

document.addEventListener('DOMContentLoaded', function () {
    setLoaderOnCurrentCity();
    loadCurrentCityData();
    loadCitiesFromStorage();
});

function loadCurrentCityData() {
    navigator.geolocation.getCurrentPosition(function (position) {
        updateCurrentCityInfo({
            'latitude': position.coords.latitude,
            'longitude': position.coords.longitude
        });
    }, function (e) {
        updateCurrentCityInfo({
            'latitude': 55.76,
            'longitude': 37.62
        });
        console.warn(`Unable to access to geolocation: ` + e.message)
    });
}

async function updateCurrentCityInfo(coordinates) {
    let weatherData = await getWeatherByCoordinates(coordinates['latitude'], coordinates['longitude'])
    currentCity.removeChild(currentCity.getElementsByClassName('current_weather')[0]);
    currentCity.removeChild(currentCity.getElementsByClassName('current_info')[0]);
    currentCity.innerHTML += renderCurrentCityData(weatherData);
    unsetLoaderOnCurrentCity();
}

async function loadCitiesFromStorage() {
    const copiedStorage = {};
    for (let key of Object.keys(cityStorage)) {
        copiedStorage[key] = cityStorage.getItem(key);
    }
    cityStorage.clear();

    for (let key in copiedStorage) {
        await addCityToUI(key);
    }
}

async function addCityToUI(cityName) {
    var cityId = cityName;

    let weatherData = await getWeatherByCityName(cityName);
    if (cityStorage.getItem(weatherData['name']) !== null) {
        alert('You already have this city in favorites');
        return null;
    }

    citiesList.innerHTML += renderCityLoader(cityId);

    if (weatherData['cod'] !== 200) {
        alert('City name is incorrect or information is missing.');
        deleteCityById(cityId);
        return null;
    }

    cityStorage.setItem(weatherData['name'], cityId);
    const cityObject = document.getElementById(`favorite_${cityId}`);
    cityObject.innerHTML += renderCityData(weatherData);
    cityObject.innerHTML += renderWeatherInfo(weatherData);
    unsetLoaderOnCity(cityId);
}

function deleteCityById(cityId) {
    var cityObject = document.getElementById(`favorite_${cityId}`);
    cityObject.remove();
}

function renderCurrentCityData(weatherData) {
    return `
        <div class="current_info">
            <h2 class="city-header">${weatherData['name']}</h2>
            <div class="break"></div>
            <img src="${getWeatherIcon(weatherData['weather'][0]['icon'])}" class="weather-icon" alt="Иконка погоды">
            <div class="current_temp">${Math.round(weatherData['main']['temp_min'])}&deg;C</div>
        </div>
        <div class="current_weather">
            <ul>
                <li class="weather-info"><div class="key">Температура</div><div class="value">${Math.round(weatherData['main']['temp_min'])}&deg;C</div></li>
                <li>
                  <div>Ветер</div>
                  <div>${weatherData['wind']['speed']} m/s, ${weatherData['wind']['deg']}</div>
                </li>
                <li class="weather-info"><div class="key">Ветер</div> <div class="value">${weatherData['wind']['speed']} m/s, ${weatherData['wind']['deg']}</div></li>
                <li class="weather-info"><div class="key">Давление</div> <div class="value">${weatherData['main']['pressure']} hpa</div></li>
            </ul>
        </div> `
}

function renderCityData(weatherData) {
    return `
        <div class="city-header">
            <h3 class="city-name">${weatherData['name']}</h3>
            <button class="close-button">&times;</button>
        </div>
        <div class="break"></div>`
}

function renderWeatherInfo(weatherData) {
    return `
        <ul class="current_weather">
            <li class="weather-info"><div class="key">Температура</div><div class="value">${Math.round(weatherData['main']['temp_min'])}&deg;C</div></li>
            <li class="weather-info"><div class="key">Ветер</div> <div class="value">${weatherData['wind']['speed']} m/s, ${weatherData['wind']['deg']}</div></li>
            <li class="weather-info"><div class="key">Давление</div> <div class="value">${weatherData['main']['pressure']} hpa</div></li></ul>`
}

function renderCityLoader(cityId) {
    return `
        <li class="loader-on favorite" id="favorite_${cityId}">
            <div class="city-loader">
                <span>Подождите, данные загружаются</span>
                <div class="loader-icon"></div>
            </div>
        </li>
    `
}

function setLoaderOnCurrentCity() {
    if (!currentCity.classList.contains('loader-on')) {
        currentCity.classList.add('loader-on');
    }
}

function unsetLoaderOnCurrentCity() {
    currentCity.classList.remove('loader-on');
}

function unsetLoaderOnCity(cityId) {
    const cityObject = document.getElementById(`favorite_${cityId}`);
    cityObject.classList.remove('loader-on');
}


function getWeatherByCityName(cityName) {
    const url = `${API_URL}?q=${cityName}&units=metric&appid=${APIkey}`;
    return doRequest(url);
}

function getWeatherByCoordinates(lat, lon) {
    const url = `${API_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${APIkey}`;
    return doRequest(url);
}

function getWeatherIcon(iconName) {
    return `https://openweathermap.org/img/wn/${iconName}.png`
}

function doRequest(url) {
    return fetch(url).then(response => {
        return response.json();
    }).catch(e => {
        console.warn(`There has been a problem with your fetch operation for resource "${url}": ` + e.message)
    });
}
