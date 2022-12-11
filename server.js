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

    const searchList = await page.waitForSelector(`legend`, { visible: true, timeout: 0 });
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
async function downloadCsv(fileUrl, browser, progress) {
  // await page.waitForNavigation({waitUntil: 'domcontentloaded'})
  try {
    const page = await browser.newPage();
    await page.goto(fileUrl,{ timeout: 0});
    page.$eval(".dis-csv-list", (el) => {
      el.children[0].children[0].click();
      console.log('downloading...');
    });
    console.log(progress);
    // await page.waitForNavigation({waitUntil: 'domcontentloaded'}, async (res) => {
    //   res.then(res => log(res));
    //   await page.close()
    // })
    // await page.close();
  } catch (err) {
    console.log("FAILED: downloadCsv()", err.message);
    await page.close();
    return
  }
}

async function runSraper() {
  const browser = await puppeteer.launch({ headless: false });
  loadLinkIdList.forEach(async (linkId, index) => {
    try {
      console.log(`START: ID ${index + 1} of ${loadLinkIdList.length} (${linkId}))`);
      const result = await scrape(linkId, await browser);
      if (await result) {
        await result.forEach(async (href, index, arr) => {
          if (href.includes("https://disclosures.utah.gov/Search/PublicSearch/FolderDetails/")) {
            // await downloadingPage.waitForNavigation({waitUntil: 'networkidle0'})
            // const downloadingPage = await browser.newPage();
            let progress = ((index+1)/arr.length)*100;
            downloadCsv(href, await browser, progress);  
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
