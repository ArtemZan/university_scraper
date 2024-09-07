const puppeteer = require("puppeteer")

const scanned = []
const failedToLoad = []

const queued = []

const weirdUrls = []

function normalizeUrl(url, baseUrl) {
    if (baseUrl.endsWith("/")) {
        baseUrl = baseUrl.slice(0, -1)
    }

    if (url.match(/^[a-zA-Z0-9]{1,10}:\/\//)) {
        if (!url.startsWith("http")) {
            return null
        }
    }
    else {
        // Stuff like mailto:abc@gmail.com
        if (url.match(/^[a-zA-Z0-9]{1,10}:/)) {
            return null
        }

        url = baseUrl + "/" + (url.startsWith("/") ? url.slice(1) : url)
    }

    if (url.endsWith("/")) {
        url = url.slice(0, -1)
    }

    url = url.replaceAll("/?", "?")
    url = url.split("#")[0]
    url = url.split("?")[0]

    return url
}

const otherSites = []

async function getWebsitePages(startUrl) {
    const browserSettings = {protocolTimeout: 10_000_000, args: ['--disable-features=site-per-process']}
    let browser = await puppeteer.launch(browserSettings)
    let page = await browser.newPage()

    queued.push("https://developers.deepl.com/docs/v/ru/resources/examples-and-guides/context-parameter-examples?fallback=true")
    queued.push(startUrl)

    while (queued.length) {
        const currentUrl = queued.pop()
        
        try {
            await page.goto(currentUrl)
        }
        catch (e) {
            console.log("Error while loading page: ", e)
            failedToLoad.push({
                url: currentUrl,
                error: e
            })

            queued.push(currentUrl)

            console.log("Reopen the browser")
            await browser.close()
            browser = await puppeteer.launch(browserSettings)
            page = await browser.newPage()


            continue
        }

        scanned.push(currentUrl)

        const anchors = await page.$$("a")

        const base = await page.$$("base")

        if (base.length > 1) {
            console.log("More than 1 base tag (weird). Only taking into account the last one")
        }

        const baseTag = base[base.length - 1]
        const baseUrl = (baseTag && (await (await baseTag.getProperty("href")).jsonValue()).href) || startUrl

        const baseUrlWithoutTrailingSlash = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl

        const parentDomain = baseUrlWithoutTrailingSlash.split("://")[1]//.split(".").slice(-2).join(".")

        console.log("Checking: ", currentUrl, "Parent domain: ", parentDomain)
        console.log(queued.length, scanned.length)
        
        for (const anchor of anchors) {
            const href = await (await anchor.getProperty("href")).jsonValue()

            const anchorUrl = normalizeUrl(href, baseUrl)

            if (!anchorUrl) {
                //console.log("=====Weird: ", href)
                weirdUrls.push(href)
                continue
            }

            if (!anchorUrl.startsWith(baseUrlWithoutTrailingSlash)) {
                //console.log("=====Other site: ", anchorUrl)
                otherSites.push(anchorUrl)
                continue
            }

            //console.log("Normalized url. Was: ", href, "now: ", anchorUrl)

            if (!scanned.includes(anchorUrl) && !queued.includes(anchorUrl)) {
                console.log("Adding: ", anchorUrl)
                queued.push(anchorUrl)
            }
        }

        if (scanned.length % 100 === 0) {
            console.log("Reached " + scanned.length + " scanned pages: ", JSON.stringify(scanned))
        }
    }

    return scanned
}


module.exports = {
    getWebsitePages
}