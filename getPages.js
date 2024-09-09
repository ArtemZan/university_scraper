const puppeteer = require("puppeteer")
const fs = require("node:fs")

const maxThreadsCount = 5

const pagesScraped = []

const failedToScrape = []

const urlsLeft = {
    current: null
}

async function pageGoTo(page, url) {

    console.log("Checking out url: ", url)

    try {
        await page.goto(url, {
            waitUntil: "networkidle0"
        })
        
        const extractedText = await page.$eval('*', (el) => {
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNode(el);
            selection.removeAllRanges();
            selection.addRange(range);
            return window.getSelection().toString();
        });
        console.log("From url: ", url, "extractedText length: ", extractedText.length)

        pagesScraped.push({
            url,
            content: extractedText
        })
    }
    catch (e) {
        console.log(e)
        failedToScrape.push(url)
    }
    finally {
        if (urlsLeft.current.length) {
            await pageGoTo(page, urlsLeft.current.pop())
        }
    }
}

async function getWebsitePages(sitemap) {
    urlsLeft.current = [...sitemap]

    const pagesCount = Math.min(maxThreadsCount, sitemap.length)
    const browser = await puppeteer.launch()

    await Promise.all(
        new Array(pagesCount)
            .fill(null, 0, pagesCount)
            .map(() => browser.newPage().then(page => pageGoTo(page, urlsLeft.current.pop())))
    )

    console.log("Got all pages!")

    fs.writeFileSync("./data.json", JSON.stringify(pagesScraped))

    return {
        pagesScraped,
        failedToScrape
    }
}


module.exports = {
    getWebsitePages
}