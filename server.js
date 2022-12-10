const express = require("express");
const puppeteer = require("puppeteer");
const app = express();
const port = 3000;

const localSite = "http://127.0.0.1:5500/Lieutenant%20Governor's%20Office%20-%20Public%20Search.html";
const disclosureSite = "https://disclosures.utah.gov/Search/PublicSearch";

const loadLinkIdList = ['PCC', 'CORP', 'ELECT', 'INDEXP', 'LABOR', 'PAC', 'PIC', 'PARTY'];


/**
 * 
 * @param {string} loadLinkId 
 * @param {Promise<puppeteer.Browser>} browser 
 * @returns {string[]} list of urls
 */
async function scrape(loadLinkId, browser) {
  const page = await browser.newPage();
  try {
    await page.goto(disclosureSite);
    await page.click(`#${loadLinkId}`);

    const searchList = await page.waitForSelector(`legend`, { visible: true });
    let refList;
    if (await searchList) {
      refList = await page.$$eval(`a`, (aTags) => {
        return aTags.map((a) => {
          return a.href;
        });
      });
      page.close();
      return await refList;
    }
  } catch (err) {
    console.log(`FAILED: scrape() (${loadLinkId}))`, err.message);
    page.close();
  }
}

/**
 * 
 * @param {string} fileUrl 
 * @param {Promise<puppeteer.Browser>} browser 
 */
async function downloadCsv(fileUrl, browser) {
  const page = await browser.newPage();
  try {
    await page.goto(fileUrl);
    page.$eval(".dis-csv-list", (el) => {
      el.children[0].children[0].click();
    });
    await page.close();
  } catch (err) {
    console.log("FAILED: downloadCsv()", err.message);
    await page.close();
  }
}

function runSraper() {
  const browser = puppeteer.launch({ headless: true });
  loadLinkIdList.forEach(async (linkId, index) => {
    try {
      console.log(
        `START: ID ${index + 1} of ${loadLinkIdList.length} (${linkId}))`
      );
      const result = await scrape(linkId, await browser);
      if (await result) {
        await result.forEach(async (href, index) => {
          if (href.includes("https://disclosures.utah.gov/Search/PublicSearch/FolderDetails/")) {
            downloadCsv(href, await browser);
          }
        });
      } else {console.log(`FAILED: scrape() (${linkId})`);}
    } catch (err) {
      console.log(`FAILED: ID ${index + 1} of ${loadLinkIdList.length} (${linkId}))`, err);
    }
  });
  return true;
}

runSraper();

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
