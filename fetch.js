const username = "artem_scraper_FlqCF"
const password = "uygF84m_c8pe"
const apiKey = Buffer.from(`${username}:${password}`).toString("base64")

fetch("https://ect.oxylabs.io/v1/jobs/10237944289416031620/sitemap", {
    headers: {
        Authorization: `Basic ${apiKey}`,
        "content-type": "application/json"
    }
}).then(resp => resp.text()).then(console.log)