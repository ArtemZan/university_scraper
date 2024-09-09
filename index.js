const { getWebsitePages } = require("./getPages")
const { askChatGPT } = require("./chatGPT")
const fs = require("node:fs")


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

async function createJob(websiteUrl) {
    const body = {
        "url": websiteUrl,//"https://amazon.com",
        "filters": {
            "crawl": [`${websiteUrl}.*`],
            "process": [`${websiteUrl}.*`],
            "max_depth": 3
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

const questions = [
    {
        question: "When does the semester start for local students?",
        format: "date (dd.mm.yy) or date range (dd.mm.yy - dd.mm.yy)"
    }
]

async function onScraped(jobId) {
    // const sitemap = await getSitemap(jobId)
    // fs.writeFileSync("./sitemap.json", JSON.stringify(sitemap))

    // const scrapeResult = await getWebsitePages(sitemap)

    // const pagesContent = scrapeResult.pagesScraped
    // fs.writeFileSync("./failed.json", JSON.stringify(scrapeResult.failedToScrape))

    const pagesContent = JSON.parse(fs.readFileSync("./data.json").toString("utf8"))

    const answers = []

    for (const question of questions) {
        let answered
        for (const page of pagesContent) {
            const result = await askChatGPT(question.question, page.content, question.format)

            console.log("Answer: ", result.message.content)
            if (result.message?.content !== "null") {
                answers.push({
                    answer: result.message,
                    url: page.url
                })

                answered = true
                break
            }
        }

        if (!answered) {
            answers.push(null)
        }
    }

    console.log(answers)
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
    const websiteUrl = "https://www.uni-sofia.bg"//"https://artem-zankovskiy.netlify.app"//"https://nodejs.org/en"//"https://usescraper.com"

    onScraped()

    return

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

