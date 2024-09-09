const fs = require('node:fs');

const apiKey = "dab13563fbaccb57e9b1a5fc81deb61f253d60495a31e1e367df982e98870ae4"

const headers = {
    Authorization: `Bearer ${apiKey}`,
    "content-type": "application/json"
}

const jobId = {
    current: null
}

async function createJob(websiteUrl) {
    const body = {
        urls: [
            websiteUrl
        ],
        exclude_globs: [],
        exclude_elements: "",
        output_format: "text",
        output_expiry: 604800,
        min_length: 0,
        page_limit: 10_000,
        block_resources: false,
        include_linked_files: true
    }

    const resp = await fetch("https://api.usescraper.com/crawler/jobs", {
        method: "POST",
        body: JSON.stringify(body),
        headers
    })

    const json = await resp.json()
    jobId.current = json.id

    console.log("Created a job: ", json)

    // {
    //     "id": "7YEGS3M8Q2JD6TNMEJB8B6EKVS",
    //     "urls": [
    //         "https://example.com"
    //     ],
    //     "createdAt": 1699964378397,
    //     "status": "starting",
    //     "sitemapPageCount": 0,
    //     "progress": {
    //         "scraped": 0,
    //         "discarded": 0,
    //         "failed": 0
    //     },
    //     "costCents": 0,
    //     "webhookFails": []
    // }

}

async function getJob(id) {
    try {

        const resp = await fetch(`https://api.usescraper.com/crawler/jobs/${id}`, {
            headers
        })

        const json = await resp.json()
        return json
    }
    catch (e) {
        console.log(e)
    }

}

async function onScraped(jobId) {
    const scrapedDataResp = await fetch(`https://api.usescraper.com/crawler/jobs/${jobId}/data`, {
        headers
    })

    const scrapedData = await scrapedDataResp.json()

    console.log("Got scraped pages: ", scrapedData.data.length)

    try {
        fs.writeFileSync('./data.txt', JSON.stringify(scrapedData));
        // file written successfully
    } catch (err) {
        console.error(err);
    }

}

async function init() {
    const websiteUrl = "https://nodejs.org/"//"https://usescraper.com"

    await createJob(websiteUrl)

    const interval = setInterval(async () => {
        const job = await getJob(jobId.current)
        if (!job) {
            return
        }

        // starting, running, succeeded, failed, cancelled 
        const status = job.status

        console.log(status)

        switch (status) {
            case "succeeded":
            case "failed":
            case "cancelled": {
                onScraped(jobId.current)
                clearInterval(interval)
                return
            }
            case "running": {
                console.log(job.progress)
                break;
            }
        }
    }, 10_000)
}

init()

