import { execa } from 'execa';
import { writeFileSync, unlinkSync } from "fs";
import { platform } from 'os';
import { URL } from "url";
import { scrollPageToBottom } from "puppeteer-autoscroll-down";
import puppeteer from "puppeteer";
import cliProgress from "cli-progress";

export default class PaheinBypass {

    static reJsScriptEncoded = /<script[\s\S]*?>[\s\S]*?<\/script>/gi;
    static reHideContent = /<[^>]*target="_blank" class="shortc-button small [^>]* " rel="nofollow noreferrer noopener">([^<]*)<\/[^>]*>/g;
    static reLink = /window\.addEventListener\('load',function\(\){\(function\(\){let counter=0;let oldlet='[^']+';var [^=]+=([^}]+})/;

    constructor (paheUrl) {
        if (this.isValidUrl(paheUrl)){
            this.paheUrl = paheUrl;
            this.browser = null;
            this.paheHostDownloads = { hostsAvailable: [], hostsUrl: [] };
            this.bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
        }
    }

    async initializeBrowser() {
        this.browser = await puppeteer.launch({
            headless: 'new',
            executablePath: platform() === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : '/usr/bin/google-chrome-stable',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding'
            ]
        });
    }

    async getAllLinks() {
        return new Promise(async (resolve, reject) => {
            if (this.browser == null){
                await this.initializeBrowser();
            }
            const parsedLink = await this.parseLink(this.paheUrl);
            const uniqueHosts = Array.from(new Set(parsedLink.map(item => item.host)));
            const cleanItem = (item) => item.trim().split(' ')[0];
            const cleanedArray = uniqueHosts.map(cleanItem);
            const uniqueArray = [...new Set(cleanedArray)];
            this.paheHostDownloads = { hostsAvailable: uniqueArray, hostsUrl: parsedLink };
            
            resolve(this.paheHostDownloads);
        });
    }

    async getBypassHostLinks(filterHost = []){
        return new Promise(async (resolve, reject) => {
            let resultAll = [];
            const filterLinkByHost = (arrLink, filter) => {
                const filteredLinks = [];
                for (const link of arrLink) {
                    const linkHost = link.host.trim().split(' ')[0] || link.host; 
                    if (filter.includes(linkHost)) {
                        filteredLinks.push(link);
                    }
                }
                return filteredLinks;
            };
            const parsedLink = this.paheHostDownloads.hostsUrl;
            const parsedLinkFiltered = filterLinkByHost(parsedLink, filterHost);
            const linkCount = filterHost.length > 0 ? parsedLinkFiltered.length : parsedLink.length;
            this.bar.start(linkCount, 0);
            const bypassingLink = async _ => {
                for (let index = 0; index < linkCount; index++) {
                    const link = filterHost.length > 0 ? parsedLinkFiltered[index].link : parsedLink[index].link;
                    const host = filterHost.length > 0 ? parsedLinkFiltered[index].host : parsedLink[index].host;
                    const dlLink = await this.bypassUrl(link);
                    resultAll.push({link: link, host: host, dlLink: dlLink});
                    this.bar.update(index + 1);
                }
            };
            await bypassingLink();
            this.bar.update(linkCount);
            this.bar.stop();
            await this.browser.close();
            resolve(resultAll);
        });
    }

    async parseLink (paheUrl) {
        return new Promise(async (resolve, reject) => {
            let tempJsPahe = 'filepahe.js';
            const page = await this.browser.newPage();
            page.setDefaultNavigationTimeout(0);
            await page.goto(paheUrl);
            const content = await page.content();
            let resultsHost = [];
            let resultAll = [];
            let resultJs = content.match(PaheinBypass.reJsScriptEncoded);
            let match;
            while (match = PaheinBypass.reHideContent.exec(content)) {
                resultsHost.push(match[1]); 
            }
            resultJs.forEach((content) => {
                if (content.includes("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/")) {
                    writeFileSync(tempJsPahe, content.replace('<script>','').replace('</script>',''));
                }
            });
            let resultJsPaheLink = null;
            try {
                await execa('node', [tempJsPahe]);
            }catch (error) {
                resultJsPaheLink = String(error.stderr);
            }
            let resultJsonLink = resultJsPaheLink.match(PaheinBypass.reLink);
            const matchsLink = JSON.parse(resultJsonLink[1]);
            let arrIndex = 0;
            Object.entries(matchsLink).forEach(([key, value]) => {
                resultAll.push({link: value.trim(), host: resultsHost[arrIndex].trim()});
                arrIndex++;
            });
            unlinkSync(tempJsPahe);
            await page.close();
            resolve(resultAll);
        })
    }

    async bypassUrl (urlLink) {
        return new Promise(async (resolve, reject) => {
            try {
                const page = await this.browser.newPage();
                page.setDefaultNavigationTimeout(0);
                await page.goto(urlLink);
                await page.waitForNavigation({waitUntil: 'load'});
                const urlObject = new URL(page.url());
                const urlHost = urlObject.host;
                if (urlHost === "intercelestial.com"){
                    await page.waitForSelector('#soralink-human-verif-main', { visible: true });
                    await page.click('#soralink-human-verif-main');
                    await page.waitForSelector("#generater", { visible: true });
                    let elementG = await page.$("#generater");
                    let boxG = await elementG.boundingBox();
                    await page.mouse.click(boxG.x + boxG.width / 2, boxG.y + boxG.height / 2);
                    await page.waitForSelector("#showlink", { visible: true });
                    let elementSL = await page.$("#showlink");
                    let boxSL = await elementSL.boundingBox();
                    await page.mouse.click(boxSL.x + boxSL.width / 2, boxSL.y + boxSL.height / 2);

                    await new Promise(r => setTimeout(r, 8 * 1000));
                    const pages = await this.browser.pages();
                    const directDlLink = await this.parseDlLinkPage(pages);

                    resolve(directDlLink);
                }else if (urlHost === "linegee.net"){
                    await page.waitForSelector('#soralink-human-verif-main', { visible: true });
                    await page.click('#soralink-human-verif-main');
                    await page.waitForSelector("#generater", { visible: true });
                    let elementG = await page.$("#generater");
                    let boxG = await elementG.boundingBox();
                    await page.mouse.click(boxG.x + boxG.width / 2, boxG.y + boxG.height / 2);
                    await page.waitForSelector("#showlink", { visible: true });
                    let elementSL = await page.$("#showlink");
                    let boxSL = await elementSL.boundingBox();
                    await page.mouse.click(boxSL.x + boxSL.width / 2, boxSL.y + boxSL.height / 2);
                    
                    await new Promise(r => setTimeout(r, 8 * 1000));
                    const pages = await this.browser.pages();
                    const directDlLink = await this.parseDlLinkPage(pages);

                    resolve(directDlLink);
                }else if (urlHost === "teknoasian.com"){
                    // Maybe PAHE no longer uses the teknoasian.com domain for download links.
                    /* await new Promise(r => setTimeout(r, 8000));
                    await scrollPageToBottom(page);
                    await page.$eval("img[src='https://teknoasian.com/wp-content/uploads/2023/09/ok-lets-continue.png']", (el) => {
                        el.click()
                    });
                    await page.waitForNavigation();
                    await scrollPageToBottom(page);
                    await page.$eval("img[src='https://teknoasian.com/wp-content/uploads/2023/09/download.png']", (el) => {
                        el.click()
                    });
                    */
                    resolve('');
                }
            } catch (e) {
                resolve('');
            }
        })
    }

    async parseDlLinkPage (pages) {
        return new Promise(async (resolve, reject) => {
            const urlObject = new URL(pages[2].url());
            const urlHost = urlObject.host;
            if (urlHost == "spacetica.com") {
                try {
                    const content = await pages[2].content();
                    let reDirectLink = /<a href="([^"]+)"?>\s+<button class="btn btn-default">Continue<\/button>\s+<\/a>/;
                    const urlDirect = content.match(reDirectLink);
                    const linkBypass = urlDirect[1];
                    for (const [index, pgs] of pages.entries()) {
                        if (index != 0){
                            await pgs.close();
                        }
                    }
                    resolve(linkBypass);
                } catch (e) {
                    resolve('');
                }
            } else if (urlHost === "linegee.net") {
                try {
                    const content = await pages[2].content();
                    let reDirectAtob = /atob\('([^']+)'\);/;
                    const urlDirect = content.match(reDirectAtob);
                    const linkBypass = atob(urlDirect[1]);
                    for (const [index, pgs] of pages.entries()) {
                        if (index != 0){
                            await pgs.close();
                        }
                    }
                    resolve(linkBypass);
                } catch (e) {
                    resolve('');
                }
            }
        });
    }

    isValidUrl (string) {
        try {
            const urlObject = new URL(string);
            const urlHost = urlObject.host;

            const paheDomain = ["pahe.in", "pahe.ph", "pahe.li", "pahe.me", "pahe.ink"];

            if (paheDomain.includes(urlHost)) return true;
            return false;
        } catch (err) {
            return false;
        }
    }
}
