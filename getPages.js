const puppeteer = require("puppeteer")
const fs = require("node:fs")

const maxThreadsCount = 5

const pagesScraped = []

const urlsLeft = {
    current: null
}

async function pageGoTo(page, url) {
    await page.goto(url, {
        waitUntil: "networkidle0"
    })

    const content = await page.content()

    pagesScraped.push({
        url,
        content
    })

    if(urlsLeft.current.length) {
        await pageGoTo(page, urlsLeft.current.pop())
    }
}

async function getWebsitePages(sitemap) {
    urlsLeft.current = [...sitemap]

    const pagesCount = Math.min(maxThreadsCount, sitemap.length)
    const browser = await puppeteer.launch()

    await Promise.all(
        new Array(pagesCount)
            .map(() => browser.newPage().then(page => pageGoTo(page, urlsLeft.current.pop())))
    )

    console.log("Got all pages!")

    fs.writeFileSync("./data.json", JSON.stringify(pagesScraped))
}


module.exports = {
    getWebsitePages
}