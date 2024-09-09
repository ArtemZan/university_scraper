const puppeteer = require("puppeteer")



// const apiKey = "dab13563fbaccb57e9b1a5fc81deb61f253d60495a31e1e367df982e98870ae4"
const username = "artem_scraper_FlqCF"
const password = "uygF84m_c8pe"
const apiKey = Buffer.from(`${username}:${password}`).toString("base64")

const oxylabsHeaders = {
    Authorization: `Basic ${apiKey}`,
    "content-type": "application/json"
}

const jobId = {
    current: null
}

async function askChatGPT(question, sourceText) {
    const message = `
        ${question}
        Answer that question using the information from the following text:
        ${sourceText}
    `

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${openaiToken}`
        },
        body: JSON.stringify({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: message
                }
            ]
        })
    })

    const json = await response.json()

    console.log(json)

    return json.choices[0]
}

async function createJob(websiteUrl) {
    const body = {
        "url": websiteUrl,//"https://amazon.com",
        "filters": {
            "crawl": [".*"],
            "process": [".*"],
            "max_depth": 5
        },
        "scrape_params": {
            "source": "universal",
            "user_agent_type": "desktop",
            render: "html"
        },
        "output": {
            "type_": "sitemap"
        }
    }

    const resp = await fetch("https://ect.oxylabs.io/v1/jobs", {
        method: "POST",
        body: JSON.stringify(body),
        headers: oxylabsHeaders
    })

    const json = await resp.json()
    jobId.current = json.id

    console.log("Created a job: ", json, JSON.stringify(json))
}

async function getJob(id) {
    try {

        const resp = await fetch(`https://ect.oxylabs.io/v1/jobs/${id}`, {
            headers: oxylabsHeaders,
        })

        const json = await resp.json()
        console.log(json)
        return json
    }
    catch (e) {
        console.log(e)
    }

}



async function onScraped(jobId) {
    const sitemap = await getSitemap(jobId)

    await getWebsitePages(sitemap)

}

async function getSitemap(jobId) {
    const resp = await fetch(`https://ect.oxylabs.io/v1/jobs/${jobId}/sitemap`, {
        headers: {
            Authorization: `Basic ${apiKey}`,
            "content-type": "application/json"
        }
    })

    const result = await resp.json()
    const sitemap = result.results?.[0]?.sitemap

    console.log(sitemap)

    return sitemap
}

async function init() {
    const websiteUrl = "https://artem-zankovskiy.netlify.app/"//"https://nodejs.org/en"//"https://usescraper.com"

    await createJob(websiteUrl)

    const interval = setInterval(async () => {
        const job = await getJob(jobId.current)
        if (!job) {
            return
        }

        const events = job.events

        console.log("Events: ", events)

        if (events.some(event => event.event === "job_results_aggregated" && event.status === "done")) {
            onScraped(jobId.current)
            clearInterval(interval)
            return
        }
    }, 10_000)
}

init()

