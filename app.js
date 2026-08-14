// ============================================================
// EXPLORADOR 3D DE ZONAS HORARIAS
// ============================================================


// ------------------------------------------------------------
// URLs DE DATOS
// ------------------------------------------------------------

const COUNTRIES_URL =
    "./countries.geojson";

const REST_COUNTRIES_URL =
    "https://restcountries.com/v3.1/all?fields=name,cca3,cca2,languages,flags,capital,population";


// ------------------------------------------------------------
// ELEMENTOS
// ------------------------------------------------------------

const globeElement =
    document.getElementById("globe");

const startup =
    document.getElementById("startup");

const infoPanel =
    document.getElementById("infoPanel");

const closePanel =
    document.getElementById("closePanel");

const countryName =
    document.getElementById("countryName");

const countryOfficial =
    document.getElementById("countryOfficial");

const countryFlag =
    document.getElementById("countryFlag");

const coordinates =
    document.getElementById("coordinates");

const timezone =
    document.getElementById("timezone");

const localTime =
    document.getElementById("localTime");

const languages =
    document.getElementById("languages");

const temperature =
    document.getElementById("temperature");

const feelsLike =
    document.getElementById("feelsLike");

const humidity =
    document.getElementById("humidity");

const wind =
    document.getElementById("wind");

const weatherIcon =
    document.getElementById("weatherIcon");

const weatherDescription =
    document.getElementById("weatherDescription");

const loadingInfo =
    document.getElementById("loadingInfo");

const countrySearch =
    document.getElementById("countrySearch");

const searchResults =
    document.getElementById("searchResults");


// ------------------------------------------------------------
// VARIABLES
// ------------------------------------------------------------

let globe;

let countries = [];

let countriesByISO = {};

let selectedTimezone = null;


// ------------------------------------------------------------
// INICIAR
// ------------------------------------------------------------

async function start() {

    try {

        await createGlobe();

        // Cargar información de países después
        // de que el planeta ya esté funcionando.
        loadCountries()
            .catch(error => {
                console.warn(
                    "No se pudieron cargar los países:",
                    error
                );
            });

        startup.classList.add("hide");

    } catch (error) {

        console.error(
            "ERROR REAL:",
            error
        );

        startup.innerHTML = `

            <div style="
                text-align:center;
                max-width:500px;
                padding:30px;
            ">

                <div style="font-size:55px">
                    ⚠️
                </div>

                <h2>
                    Error al iniciar el planeta
                </h2>

                <p style="
                    color:#9bb1c9;
                    line-height:1.6;
                ">
                    El planeta no pudo iniciarse.
                </p>

                <p style="
                    color:#ff9b9b;
                    font-size:12px;
                    word-break:break-word;
                ">
                    ${error.message}
                </p>

            </div>

        `;

    }

}

  


// ------------------------------------------------------------
// CARGAR INFORMACIÓN DE PAÍSES
// ------------------------------------------------------------

async function loadCountries() {

    const response =
        await fetch(
            REST_COUNTRIES_URL
        );

    if (!response.ok) {

        throw new Error(
            "No se pudo cargar REST Countries"
        );

    }

    countries =
        await response.json();


    countries.forEach(country => {

        if (country.cca3) {

            countriesByISO[
                country.cca3
            ] = country;

        }

    });

}


// ------------------------------------------------------------
// CREAR GLOBO
// ------------------------------------------------------------

async function createGlobe() {

    const response =
        await fetch(
            COUNTRIES_URL
        );

    if (!response.ok) {

        throw new Error(
            "No se pudo cargar el mapa mundial"
        );

    }


    const world =
        await response.json();


    globe = Globe(globeElement)


        // ----------------------------------------------------
        // TEXTURA DE LA TIERRA
        // ----------------------------------------------------

        .globeImageUrl(
            "https://cdn.jsdelivr.net/npm/three-globe@2.45.2/example/img/earth-blue-marble.jpg"
        )


        // ----------------------------------------------------
        // ESTRELLAS
        // ----------------------------------------------------

        .backgroundImageUrl(
            "https://cdn.jsdelivr.net/npm/three-globe@2.45.2/example/img/night-sky.png"
        )


        // ----------------------------------------------------
        // ATMÓSFERA
        // ----------------------------------------------------

        .showAtmosphere(true)

        .atmosphereColor(
            "#4da6ff"
        )

        .atmosphereAltitude(
            0.16
        );


    // --------------------------------------------------------
    // PAÍSES
    // --------------------------------------------------------

    globe

        .polygonsData(
            world.features
        )


        .polygonAltitude(
            0.008
        )


        .polygonCapColor(
            feature => {

                const iso =
                    feature.properties.ISO_A3;

                return countryColor(iso);

            }
        )


        .polygonSideColor(
            () =>
                "rgba(20,100,160,.55)"
        )


        .polygonStrokeColor(
            () =>
                "rgba(130,205,255,.8)"
        )


        .polygonLabel(
            feature => {

                const iso =
                    feature.properties.ISO_A3;

                const country =
                    countriesByISO[iso];

                const name =
                    country?.name?.common
                    ||
                    feature.properties.NAME
                    ||
                    "Territorio";

                return `

                    <div style="
                        background:#03101f;
                        padding:9px 13px;
                        border-radius:9px;
                        border:1px solid #4a9ee0;
                        color:white;
                        font-family:Arial;
                    ">

                        <b>
                            ${name}
                        </b>

                        <br>

                        <small style="
                            color:#8fbce8;
                        ">
                            Haz clic para información
                        </small>

                    </div>

                `;

            }
        )


        .onPolygonClick(
            async (
                feature,
                event,
                coords
            ) => {

                await selectCountry(
                    feature,
                    coords.lat,
                    coords.lng
                );

            }
        );


    // --------------------------------------------------------
    // LÍNEAS DE ZONAS HORARIAS
    // --------------------------------------------------------

    const timezoneLines =
        createTimezoneLines();


    globe

        .pathsData(
            timezoneLines
        )


        .pathPoints(
            line =>
                line.points
        )


        .pathColor(
            () =>
                "rgba(255,214,74,.75)"
        )


        .pathStroke(
            0.10
        )


        .pathResolution(
            1
        )


        .pathLabel(
            line => {

                const offset =
                    line.longitude / 15;

                let text;

                if (offset === 0) {

                    text =
                        "UTC±0";

                } else {

                    const sign =
                        offset > 0
                            ? "+"
                            : "";

                    text =
                        `UTC${sign}${offset}`;

                }

                return `

                    <div style="
                        background:#181200;
                        border:1px solid #ffd64a;
                        color:#ffe58a;
                        padding:5px 8px;
                        border-radius:6px;
                        font-size:11px;
                    ">

                        ${text}

                    </div>

                `;

            }

        );


    // --------------------------------------------------------
    // CLICK EN OCÉANO
    // --------------------------------------------------------

    globe.onGlobeClick(
        async coords => {

            await showLocation(
                coords.lat,
                coords.lng
            );

        }
    );


    // --------------------------------------------------------
    // CONTROLES
    // --------------------------------------------------------

    const controls =
        globe.controls();


    controls.enableDamping =
        true;

    controls.dampingFactor =
        0.08;

    controls.rotateSpeed =
        0.45;

    controls.zoomSpeed =
        0.7;

    controls.minDistance =
        115;

    controls.maxDistance =
        500;


    // --------------------------------------------------------
    // POSICIÓN INICIAL
    // --------------------------------------------------------

   
// Ajustar el tamaño inicial del globo
setTimeout(() => {

    resizeGlobe();

    globe.pointOfView(
        {
            lat: 20,
            lng: 0,
            altitude: 2.2
        },
        0
    );

}, 100);

    // --------------------------------------------------------
    // RESIZE
    // --------------------------------------------------------

    window.addEventListener(
        "resize",
        resizeGlobe
    );

}


// ------------------------------------------------------------
// COLORES DE PAÍSES
// ------------------------------------------------------------

function countryColor(iso) {

    const colors = [

        "#19517d",
        "#1d5d8d",
        "#246a9b",
        "#1f628f",
        "#2b729f",
        "#235b86",
        "#317aa4"

    ];


    if (!iso) {

        return colors[0];

    }


    let hash = 0;


    for (
        let i = 0;
        i < iso.length;
        i++
    ) {

        hash =
            iso.charCodeAt(i)
            +
            ((hash << 5) - hash);

    }


    return colors[
        Math.abs(hash) % colors.length
    ];

}


// ------------------------------------------------------------
// CREAR ZONAS HORARIAS TEÓRICAS
// ------------------------------------------------------------

function createTimezoneLines() {

    const lines = [];


    for (
        let longitude = -180;
        longitude <= 180;
        longitude += 15
    ) {

        const points = [];


        for (
            let latitude = -89;
            latitude <= 89;
            latitude += 2
        ) {

            points.push(
                [
                    latitude,
                    longitude
                ]
            );

        }


        lines.push({

            longitude,

            points

        });

    }


    return lines;

}


// ------------------------------------------------------------
// SELECCIONAR PAÍS
// ------------------------------------------------------------

async function selectCountry(
    feature,
    lat,
    lng
) {

    const iso =
        feature.properties.ISO_A3;


    const country =
        countriesByISO[iso];


    const name =
        country?.name?.common
        ||
        feature.properties.NAME
        ||
        "Territorio";


    countryName.textContent =
        name;


    countryOfficial.textContent =
        country?.capital?.length
            ? `Capital: ${country.capital[0]}`
            : "Información geográfica";


    if (
        country?.flags?.emoji
    ) {

        countryFlag.textContent =
            country.flags.emoji;

    } else {

        countryFlag.textContent =
            "🌎";

    }


    if (
        country?.languages
    ) {

        languages.textContent =
            Object.values(
                country.languages
            ).join(", ");

    } else {

        languages.textContent =
            "No disponible";

    }


    await showLocation(
        lat,
        lng
    );

}


// ------------------------------------------------------------
// INFORMACIÓN DE UNA LOCALIZACIÓN
// ------------------------------------------------------------

async function showLocation(
    lat,
    lng
) {

    coordinates.textContent =
        `${lat.toFixed(3)}°, ${lng.toFixed(3)}°`;


    // --------------------------------------------------------
    // ZONA HORARIA
    //
    // Esta versión utiliza una aproximación geográfica
    // basada en longitud.
    //
    // Para una versión posterior podemos integrar los
    // polígonos oficiales/reales de las zonas horarias.
    // --------------------------------------------------------

    const tz =
        getApproxTimezone(lng);


    selectedTimezone =
        tz;


    timezone.textContent =
        formatTimezone(tz);


    updateClock();


    await getWeather(
        lat,
        lng
    );


    infoPanel.classList.remove(
        "hidden"
    );

}


// ------------------------------------------------------------
// ZONA HORARIA APROXIMADA
// ------------------------------------------------------------

function getApproxTimezone(
    longitude
) {

    let offset =
        Math.round(
            longitude / 15
        );


    if (offset > 14) {

        offset = 14;

    }


    if (offset < -12) {

        offset = -12;

    }


    if (offset === 0) {

        return "UTC";

    }


    const sign =
        offset > 0
            ? "+"
            : "";


    return `Etc/GMT${sign}${-offset}`;

}


// ------------------------------------------------------------
// MOSTRAR ZONA
// ------------------------------------------------------------

function formatTimezone(
    tz
) {

    if (
        tz === "UTC"
    ) {

        return "UTC±0";

    }


    const match =
        tz.match(
            /GMT([+-])(\d+)/
        );


    if (!match) {

        return tz;

    }


    const sign =
        match[1];

    const number =
        match[2];


    // Etc/GMT utiliza signos invertidos
    const offset =
        sign === "+"
            ? -number
            : number;


    return `UTC${offset >= 0 ? "+" : ""}${offset}`;

}


// ------------------------------------------------------------
// HORA LOCAL
// ------------------------------------------------------------

function updateClock() {

    if (
        !selectedTimezone
    ) {

        return;

    }


    try {

        const now =
            new Date();


        const time =
            new Intl.DateTimeFormat(
                "es-AR",
                {
                    timeZone:
                        selectedTimezone,

                    weekday:
                        "short",

                    day:
                        "2-digit",

                    month:
                        "2-digit",

                    hour:
                        "2-digit",

                    minute:
                        "2-digit",

                    second:
                        "2-digit"
                }
            ).format(now);


        localTime.textContent =
            time;

    } catch {

        localTime.textContent =
            "No disponible";

    }

}


// ------------------------------------------------------------
// RELOJ EN TIEMPO REAL
// ------------------------------------------------------------

setInterval(
    updateClock,
    1000
);


// ------------------------------------------------------------
// CLIMA
// ------------------------------------------------------------

async function getWeather(
    lat,
    lng
) {

    loadingInfo.textContent =
        "Consultando clima...";


    weatherDescription.textContent =
        "Cargando...";


    try {

        const url =

            "https://api.open-meteo.com/v1/forecast"
            +
            `?latitude=${lat}`
            +
            `&longitude=${lng}`
            +
            "&current="
            +
            "temperature_2m,"
            +
            "relative_humidity_2m,"
            +
            "apparent_temperature,"
            +
            "weather_code,"
            +
            "wind_speed_10m"
            +
            "&timezone=auto";


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Error meteorológico"
            );

        }


        const data =
            await response.json();


        const current =
            data.current;


        temperature.textContent =
            `${Math.round(
                current.temperature_2m
            )} °C`;


        feelsLike.textContent =
            `${Math.round(
                current.apparent_temperature
            )} °C`;


        humidity.textContent =
            `${current.relative_humidity_2m}%`;


        wind.textContent =
            `${Math.round(
                current.wind_speed_10m
            )} km/h`;


        const weather =
            weatherInfo(
                current.weather_code
            );


        weatherIcon.textContent =
            weather.icon;


        weatherDescription.textContent =
            weather.text;


        loadingInfo.textContent =
            "Información actualizada";


    } catch (error) {

        console.error(error);


        weatherDescription.textContent =
            "No disponible";


        loadingInfo.textContent =
            "No se pudo obtener el clima";

    }

}


// ------------------------------------------------------------
// CÓDIGOS METEOROLÓGICOS
// ------------------------------------------------------------

function weatherInfo(
    code
) {

    const map = {

        0: [
            "☀️",
            "Despejado"
        ],

        1: [
            "🌤️",
            "Mayormente despejado"
        ],

        2: [
            "⛅",
            "Parcialmente nublado"
        ],

        3: [
            "☁️",
            "Nublado"
        ],

        45: [
            "🌫️",
            "Niebla"
        ],

        48: [
            "🌫️",
            "Niebla"
        ],

        51: [
            "🌦️",
            "Llovizna ligera"
        ],

        53: [
            "🌦️",
            "Llovizna"
        ],

        55: [
            "🌧️",
            "Llovizna intensa"
        ],

        61: [
            "🌧️",
            "Lluvia ligera"
        ],

        63: [
            "🌧️",
            "Lluvia moderada"
        ],

        65: [
            "🌧️",
            "Lluvia intensa"
        ],

        71: [
            "🌨️",
            "Nieve ligera"
        ],

        73: [
            "❄️",
            "Nieve"
        ],

        75: [
            "❄️",
            "Nieve intensa"
        ],

        80: [
            "🌦️",
            "Chubascos"
        ],

        81: [
            "🌧️",
            "Chubascos moderados"
        ],

        82: [
            "⛈️",
            "Chubascos fuertes"
        ],

        95: [
            "⛈️",
            "Tormenta"
        ],

        96: [
            "⛈️",
            "Tormenta con granizo"
        ],

        99: [
            "⛈️",
            "Tormenta fuerte"
        ]

    };


    const result =
        map[code]
        ||
        [
            "🌡️",
            "Condición desconocida"
        ];


    return {

        icon:
            result[0],

        text:
            result[1]

    };

}


// ------------------------------------------------------------
// BUSCADOR DE PAÍSES
// ------------------------------------------------------------

countrySearch.addEventListener(
    "input",
    () => {

        const text =
            countrySearch.value
            .trim()
            .toLowerCase();


        searchResults.innerHTML =
            "";


        if (
            text.length < 2
        ) {

            searchResults.style.display =
                "none";

            return;

        }


        const matches =
            countries
            .filter(country => {

                const name =
                    country.name?.common
                    ?.toLowerCase()
                    || "";

                return name.includes(text);

            })
            .slice(0, 10);


        if (
            matches.length === 0
        ) {

            searchResults.style.display =
                "none";

            return;

        }


        matches.forEach(
            country => {

                const div =
                    document.createElement(
                        "div"
                    );


                div.className =
                    "searchResult";


                div.textContent =
                    (
                        country.flags?.emoji
                        || "🌎"
                    )
                    +
                    " "
                    +
                    country.name.common;


                div.addEventListener(
                    "click",
                    () => {

                        goToCountry(
                            country
                        );

                        searchResults.style.display =
                            "none";

                        countrySearch.value =
                            "";

                    }
                );


                searchResults.appendChild(
                    div
                );

            }
        );


        searchResults.style.display =
            "block";

    }
);


// ------------------------------------------------------------
// IR AL PAÍS
// ------------------------------------------------------------

function goToCountry(
    country
) {

    if (
        !country.latlng
        ||
        country.latlng.length < 2
    ) {

        return;

    }


    const lat =
        country.latlng[0];

    const lng =
        country.latlng[1];


    globe.pointOfView(
        {
            lat,
            lng,
            altitude: 1.7
        },
        1200
    );


    countryName.textContent =
        country.name.common;


    countryOfficial.textContent =
        country.capital?.length
            ? `Capital: ${country.capital[0]}`
            : "País";


    countryFlag.textContent =
        country.flags?.emoji
        || "🌎";


    languages.textContent =
        country.languages
            ? Object.values(
                country.languages
            ).join(", ")
            : "No disponible";


    showLocation(
        lat,
        lng
    );

}


// ------------------------------------------------------------
// CERRAR PANEL
// ------------------------------------------------------------

closePanel.addEventListener(
    "click",
    () => {

        infoPanel.classList.add(
            "hidden"
        );

    }
);


// ------------------------------------------------------------
// RESIZE
// ------------------------------------------------------------

function resizeGlobe() {

    if (!globe) {

        return;

    }


    globe
        .width(
            globeElement.clientWidth
        )
        .height(
            globeElement.clientHeight
        );

}


// ------------------------------------------------------------
// ARRANCAR
// ------------------------------------------------------------

start();
