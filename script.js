const cityForm = document.forms['add-city'];
const refreshButton = document.getElementsByClassName('update')[0];
const citiesList = document.getElementsByClassName('city-list')[0];
const currentCity = document.getElementsByClassName('current-city')[0];
const cityStorage = window.localStorage;

const API_KEY = '6d00d1d4e704068d70191bad2673e0cc';
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';


async function loadCities() {
    cities = await getCities()
    for (let key of cities) {
        await addCity(key, true);
    }
}

async function getCities() {
    let cities;
    await fetch("http://localhost:3000/features")
        .then(response => response.json())
        .then(data => {
            cities = data;
        })
    return cities;
}

cityForm.addEventListener('submit', function (e) {
    const cityInput = document.getElementById('favorite-city-name');
    addCity(cityInput.value);
    cityInput.value = '';
    e.preventDefault();
});

citiesList.addEventListener('click', function (event) {
    if (!event.target.className.includes('close-button')) {
        return;
    }
    const cityId = event.target.closest('li').id.split('_')[1];
    deleteCityById(cityId);
});

refreshButton.addEventListener('click', function () {
    setLoaderOnCurrentCity();
    getCoordinates();
});

document.addEventListener('DOMContentLoaded', function () {
    setLoaderOnCurrentCity();
    getCoordinates();
    loadCities();
});

async function updateFavicon(weatherData) {
    document.getElementById('favicon').href = getWeatherIcon(weatherData);
}

function getCoordinates() {
    navigator.geolocation.getCurrentPosition(function (position) {
        let lat = position.coords.latitude;
        let lon = position.coords.longitude;
        ans = `http://localhost:3000/weather/coordinates?lat=${lat}&lon=${lon}`;
        updateCurrentCityInfo(ans)
    }, function (e) {
        ans = `http://localhost:3000/weather/city?q=москва`;
        updateCurrentCityInfo(ans)
        console.warn(`There has been a problem with access to geolocation: ` + e.message)
    });
}

async function updateCurrentCityInfo(url) {
    let weatherData = await getWeatherByCoordinates(url);
    unsetCurrentCityLoader();
    updateFavicon(weatherData);
    updateCurrentCityHeadInfo(weatherData);
    updateFullMainWeatherInfo(currentCity, weatherData);
}

function isEmptyOrSpaces(str) {
    return str === null || str.match(/^ *$/) !== null;
}

async function addCity(cityName, isLoad = false) {

    if (isEmptyOrSpaces(cityName)) {
        alert('Введите название города');
        return;
    }
    const favoriteCityElement = renderEmptyCity(cityName);
    citiesList.appendChild(favoriteCityElement);
    if (!isLoad) {
        let weatherData = await getWeatherByCityName(cityName);
        if (weatherData['cod'] !== 200) {
            alert("404. Город не найден")
            citiesList.removeChild(favoriteCityElement)
            return
        }
        if (weatherData === undefined) {
            alert('Нет подключения к интернету');
            citiesList.removeChild(favoriteCityElement)

            return;
        }
        res = await fetch('http://localhost:3000/features?city=' + cityName,
            {
                method: 'POST'
            })
        if (res.status === 300) {
            alert("Город уже в избранном")
            citiesList.removeChild(favoriteCityElement)
            return
        }
        else if (res.status === 404){
            alert("Не удается произвести подключение")
            citiesList.removeChild(favoriteCityElement)
            return
        }
    }

    let weatherData = await getWeatherByCityName(cityName);


    updateCityHeadInfo(favoriteCityElement, weatherData);
    updateFullWeatherInfo(favoriteCityElement, weatherData);
    unsetCityLoader(cityName);
}

async function deleteCityById(cityId) {
    try {
        await fetch('http://localhost:3000/features?city=' + cityId,
            {
                method: 'DELETE'
            })
            .then(res => {
                if (res.status === 200) {
                    el.remove();
                }
            })
    } catch (err) {
    }

    deleteCityFromUI(cityId);
}

function deleteCityFromUI(cityId) {
    const cityObject = document.getElementById(`favorite_${cityId}`);
    cityObject.remove();
}

function updateCurrentCityHeadInfo(weatherData) {
    currentCity.getElementsByClassName('city-header')[0].textContent = weatherData['name'];
    currentCity.getElementsByClassName('weather-icon')[0].src = getWeatherIcon(weatherData);
}

function updateCityHeadInfo(favoriteCityElement, weatherData) {
    const briefWeatherElement = favoriteCityElement.getElementsByClassName('city-header')[0];
    briefWeatherElement.getElementsByClassName('city-name')[0].textContent = weatherData['name'];
    briefWeatherElement.getElementsByClassName('temperature-number')[0].innerHTML = `${Math.round(weatherData['main']['temp_min']) - 273} &deg;C`;
    briefWeatherElement.getElementsByClassName('weather-icon')[0].src = getWeatherIcon(weatherData);
}

function updateFullMainWeatherInfo(favoriteCityElement, weatherData) {
    const fullWeatherElement = favoriteCityElement.getElementsByClassName('current_weather')[0];
    fullWeatherElement.getElementsByClassName('temperature')[0].getElementsByClassName('value')[0].textContent = `${Math.round(weatherData['main']['temp_min']) - 273} ℃`;
    fullWeatherElement.getElementsByClassName('wind')[0].getElementsByClassName('value')[0].textContent = `${weatherData['wind']['speed']} m/s`;
    fullWeatherElement.getElementsByClassName('cloudy')[0].getElementsByClassName('value')[0].textContent = weatherData['weather'][0]['main'];
    fullWeatherElement.getElementsByClassName('pressure')[0].getElementsByClassName('value')[0].textContent = `${weatherData['main']['pressure']} hpa`;
    fullWeatherElement.getElementsByClassName('humidity')[0].getElementsByClassName('value')[0].textContent = `${weatherData['main']['humidity']}%`;
}

function updateFullWeatherInfo(favoriteCityElement, weatherData) {
    const fullWeatherElement = favoriteCityElement.getElementsByClassName('current_weather')[0];
    fullWeatherElement.getElementsByClassName('wind')[0].getElementsByClassName('value')[0].textContent = `${weatherData['wind']['speed']} m/s`;
    fullWeatherElement.getElementsByClassName('cloudy')[0].getElementsByClassName('value')[0].textContent = weatherData['weather'][0]['main'];
    fullWeatherElement.getElementsByClassName('pressure')[0].getElementsByClassName('value')[0].textContent = `${weatherData['main']['pressure']} hpa`;
    fullWeatherElement.getElementsByClassName('humidity')[0].getElementsByClassName('value')[0].textContent = `${weatherData['main']['humidity']}%`;
}

function renderEmptyCity(cityName) {
    const template = document.getElementById('city-list-template');
    const favoriteCityElement = document.importNode(template.content.firstElementChild, true);
    favoriteCityElement.id = `favorite_${cityName}`;
    favoriteCityElement.className = 'loader-on'
    return favoriteCityElement;
}

function setLoaderOnCurrentCity() {
    if (!currentCity.classList.contains('loader-on')) {

        currentCity.classList.add('loader-on');
    }
}

function unsetCurrentCityLoader() {
    currentCity.classList.remove('loader-on');
}

function unsetCityLoader(cityId) {
    const cityObject = document.getElementById(`favorite_${cityId}`);
    cityObject.classList.remove('loader-on');
}


function getWeatherByCityName(city) {
    const url = `http://localhost:3000/weather/city?q=${city}`;
    return doRequest(url);
}

function getWeatherByCoordinates(url) {
    return doRequest(url);
}

function getWeatherIcon(weatherData) {
    return `https://openweathermap.org/img/wn/${weatherData['weather'][0]['icon']}.png`
}

function doRequest(url) {
    return fetch(url).then(response => {
        return response.json();
    }).catch(e => {
        console.warn(`There has been a problem with your fetch operation for resource "${url}": ` + e.message)
    });
}
