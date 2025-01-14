const apiKey = ""; // Your API key
let isCelsius = true; // Toggle between Celsius and Fahrenheit

async function fetchWeather() {
  const searchInput = document.getElementById("search").value.trim();
  const weatherDataSection = document.getElementById("weather-data");
  weatherDataSection.style.display = "block";

  if (!searchInput) {
    weatherDataSection.innerHTML = `
      <div>
        <h2>Empty Input!</h2>
        <p>Please try again with a valid <u>city name</u>.</p>
      </div>`;
    return;
  }

  weatherDataSection.innerHTML = `<p>Loading...</p>`; // Show a loading indicator

  try {
    // Get latitude and longitude
    const geocodeData = await getLonAndLat(searchInput);
    if (!geocodeData) return;

    // Get weather data
    const weatherData = await getWeatherData(geocodeData.lon, geocodeData.lat);
    if (weatherData) {
      displayWeatherData(weatherData);
    }

    // Get 5-day forecast data
    const forecastData = await getForecastData(geocodeData.lon, geocodeData.lat);
    if (forecastData) {
      displayForecastData(forecastData);
    }
  } catch (error) {
    console.error("Error fetching weather data:", error);
    weatherDataSection.innerHTML = `
      <div>
        <h2>Something went wrong!</h2>
        <p>Please check your internet connection or try again later.</p>
      </div>`;
  }
}

async function getLonAndLat(cityName) {
  const geocodeURL = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
    cityName
  )}&limit=1&appid=${apiKey}`;
  const response = await fetch(geocodeURL);

  if (!response.ok) {
    console.error("Failed to fetch geocode data:", response.status);
    alert("Unable to fetch location data. Please try again.");
    return null;
  }

  const data = await response.json();
  if (data.length === 0) {
    document.getElementById("weather-data").innerHTML = `
      <div>
        <h2>Invalid Input: "${cityName}"</h2>
        <p>Please try again with a valid <u>city name</u>.</p>
      </div>`;
    return null;
  }

  return data[0];
}

async function getWeatherData(lon, lat) {
  const weatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;
  const response = await fetch(weatherURL);

  if (!response.ok) {
    console.error("Failed to fetch weather data:", response.status);
    alert("Unable to fetch weather data. Please try again.");
    return null;
  }

  return await response.json();
}

async function getForecastData(lon, lat) {
  const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`;
  const response = await fetch(forecastURL);

  if (!response.ok) {
    console.error("Failed to fetch forecast data:", response.status);
    alert("Unable to fetch forecast data. Please try again.");
    return null;
  }

  return await response.json();
}

function displayWeatherData(data) {
  const weatherDataSection = document.getElementById("weather-data");
  const temp = isCelsius
    ? Math.round(data.main.temp - 273.15)
    : Math.round((data.main.temp - 273.15) * 9 / 5 + 32);
  const feelsLike = isCelsius
    ? Math.round(data.main.feels_like - 273.15)
    : Math.round((data.main.feels_like - 273.15) * 9 / 5 + 32);

  weatherDataSection.innerHTML = `
    <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}.png" alt="${data.weather[0].description}" width="100" />
    <div>
      <h2>${data.name}</h2>
      <p><strong>Temperature:</strong> ${temp}°${isCelsius ? "C" : "F"}</p>
      <p><strong>Feels Like:</strong> ${feelsLike}°${isCelsius ? "C" : "F"}</p>
      <p><strong>Description:</strong> ${data.weather[0].description}</p>
      <p><strong>Humidity:</strong> ${data.main.humidity}%</p>
      <p><strong>Wind Speed:</strong> ${data.wind.speed} m/s</p>
      <button onclick="toggleTemperatureUnits()">Switch to ${
        isCelsius ? "Fahrenheit" : "Celsius"
      }</button>
    </div>`;
}

function displayForecastData(data) {
  const forecastSection = document.createElement("div");
  forecastSection.classList.add("forecast");

  // Group forecasts by day
  const forecastByDay = data.list.reduce((acc, curr) => {
    const date = curr.dt_txt.split(" ")[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(curr);
    return acc;
  }, {});

  // Get up to 5 days of forecasts
  const forecastHTML = Object.keys(forecastByDay)
    .slice(0, 5)
    .map((date) => {
      const dailyData = forecastByDay[date][0]; // Take the first forecast of the day
      const temp = isCelsius
        ? Math.round(dailyData.main.temp - 273.15)
        : Math.round((dailyData.main.temp - 273.15) * 9 / 5 + 32);

      return `
        <div>
          <h3>${new Date(date).toLocaleDateString()}</h3>
          <img src="https://openweathermap.org/img/wn/${
            dailyData.weather[0].icon
          }.png" alt="${dailyData.weather[0].description}" width="50" />
          <p>${temp}°${isCelsius ? "C" : "F"}</p>
          <p>${dailyData.weather[0].description}</p>
        </div>`;
    })
    .join("");

  forecastSection.innerHTML = forecastHTML;

  const weatherDataSection = document.getElementById("weather-data");
  weatherDataSection.appendChild(forecastSection);
}

function toggleTemperatureUnits() {
  isCelsius = !isCelsius; // Toggle unit
  fetchWeather(); // Refetch and re-render data with the new unit
}
