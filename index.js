const puppeteer = require("puppeteer")
const {getWebsitePages} = require("./getPages")

const platforms = [
    "Android", "Chrome OS", "Chromium OS", "iOS", "Linux", "macOS", "Windows", "Unknown"
]

// async function getWebsitePages(url) {
//     const platform = platforms[Math.round(Math.random() * platforms.length - 1)]

//     const resp = await fetch(`https://www.xml-sitemaps.com/icrawl.php?op=crawlproc&initurl=${encodeURI(url)}&lastmod=on&priority=on&freq=&&injs=1`, {
//         "headers": {
//             "accept": "*/*",
//             "accept-language": "en-US,en;q=0.9,bg;q=0.8,uk;q=0.7,de;q=0.6,fr;q=0.5",
//             "sec-ch-ua": "\"Chromium\";v=\"128\", \"Not;A=Brand\";v=\"24\", \"Google Chrome\";v=\"128\"",
//             "sec-ch-ua-mobile": "?0",
//             "sec-ch-ua-platform": platform,
//             "sec-fetch-dest": "empty",
//             "sec-fetch-mode": "cors",
//             "sec-fetch-site": "same-origin",
//             "x-requested-with": "XMLHttpRequest"
//         },
//         "referrer": "https://www.xml-sitemaps.com/",
//         "referrerPolicy": "strict-origin-when-cross-origin",
//         "body": null,
//         "method": "GET",
//         "mode": "cors",
//         "credentials": "include"
//     })

//     const text = await resp.text()

//     console.log(text)

//     const items = text.split("\n").filter(item => item.trim())

//     const json = JSON.parse("[" + items.join(", ") + "]")

//     return json
// }


async function init() {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    const urls = await getWebsitePages("https://www.polito.it/")//("http://localhost:3000/")//("https://reklamni-materiali.com/")//("https://toscrape.com/")//("https://www.polito.it/en")

    console.log(urls, JSON.stringify(urls))

    return

    for(const url of urls) {
        console.log("Checking out url: ", decodeURI(url))
        await page.goto(url)
        const extractedText = await page.$eval('*', (el) => {
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNode(el);
            selection.removeAllRanges();
            selection.addRange(range);
            return window.getSelection().toString();
        });

        console.log("\n\n\n\n========================== EXTRACTED TEXT ===============================\n\n\n\n", extractedText, "\n\n\n\n==============================================================\n\n\n\n")
        
    }

    console.log("That was it")


}

init()

