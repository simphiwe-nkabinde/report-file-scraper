const { request, response } = require("express");
const express = require("express");
const puppeteer = require("puppeteer");
const fs = require('fs');
const res = require("express/lib/response");
const app = express();
const port = 3000;

app.get("/", (req, res) => {
  console.log("request");
  res.send("Hello World!");
  scrape();
});

const localSite = "http://127.0.0.1:5500/Lieutenant%20Governor's%20Office%20-%20Public%20Search.html";
const disclosureSite = "https://disclosures.utah.gov/Search/PublicSearch";

const loadLinkIdList = ['PCC', 'CORP', 'ELECT', 'INDEXP', 'LABOR', 'PAC', 'PIC', 'PARTY'];

async function scrape(loadLinkId, browser) {
  const page = await browser.newPage();

  await page.goto(disclosureSite);
  await page.click(`#${loadLinkId}`);

 const searchList = await page.waitForSelector(`legend`, {visible: true})
 let refList;
  if (await searchList) {
    refList = await page.$$eval(`a`, aTags => {
      return aTags.map(a => {
        return a.href
      })
    });
    page.close();
    return await refList;
  }
}

async function downloadCsv(fileUrl, browser) {
  const page = await browser.newPage();

  await page.goto(fileUrl);
  await page.click('');
  await page.close()
}

const browser = puppeteer.launch({ headless: true });
loadLinkIdList.forEach(async (linkId, index) => {
  const result = await scrape(linkId, await browser);
  const filtered = result.filter(href => {
    return href.includes('https://disclosures.utah.gov/Search/PublicSearch/FolderDetails/')
  })
  let data = JSON.stringify(filtered);
  fs.writeFileSync(`links/${linkId}.json`, data)
  console.log(`saving report urls: ${index} / ${loadLinkIdList.length}`);
});

//download files
const browser2 = puppeteer.launch({ headless: true });
loadLinkIdList.forEach((linkId, index) => {
  fs.readFile(`links/${linkId}.json`, data => {
    const linkList = JSON.parse(data);
    
    linkList.forEach(link => {
      downloadCsv(link, browser2)
    })
  })
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
