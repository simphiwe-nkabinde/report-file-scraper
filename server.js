const { request, response } = require("express");
const express = require("express");
const puppeteer = require("puppeteer");
const fs = require('fs');
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

  // await page.setDefaultNavigationTimeout(0);
  await page.goto(localSite);
  await page.click(`#${loadLinkId}`);

  await page.waitForResponse(res => res.status() == 200);
  await page.waitForSelector(`.loadContainer.${loadLinkId}`, {visible: true})
  const refList = await page.$$eval(`a`, aTags => {
    return aTags.map(a => {
      return a.href
    })
  });

  page.close();
  return await refList;

}

const browser = puppeteer.launch({ headless: false });
loadLinkIdList.forEach(async linkId => {
  const result = await scrape(linkId, await browser);
  const filtered = result.filter(href => {
    return href.includes('https://disclosures.utah.gov/Search/PublicSearch/FolderDetails/')
  })
  let data = JSON.stringify(filtered);
  fs.writeFileSync(`links/${linkId}.json`, data)
});



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
