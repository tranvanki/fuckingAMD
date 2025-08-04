// Configuration for the application
export const config = {
    // Set to true to use backend API, false to use localStorage
    USE_BACKEND_API: true,
    // Ocelot Gateway base URL
    API_BASE_URL: "https://localhost:8888/gateway",

    // Other configuration options
    APP_NAME: 'LinkShort',
    // Short URL domain for redirects (matches your Ocelot route)
    DEFAULT_SHORT_DOMAIN: 'https://localhost:8888/gateway/urls/redirect'
}

export default config