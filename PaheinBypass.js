import { platform } from 'os'
import { URL } from "url";
import { scrollPageToBottom } from "puppeteer-autoscroll-down";
import axios from "axios";
import puppeteer from "puppeteer";
import cliProgress from "cli-progress";

export default class PaheinBypass {
    
    constructor(downloadUrl) {
        if (this.isValidUrl(downloadUrl)){
            this.bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
            this.bar.start(100, 0);
            this.directLink = this.bypassUrl(downloadUrl);
        }
    }

    bypassUrl (urlLink) {
        return new Promise(async (resolve, reject) => {
            this.bar.update(90);
            const linegateUrl = await this.getLinegateUrl(urlLink);
            // Tidak tau kenapa saya pakai axios buat ambil konten linegee :)
            axios.get(linegateUrl).then((response) => {
                try {
                    const content = response.data;
                    this.bar.update(100);
                    const regexDirectAtob = /location\.href = atob\('([^']+)'\);/gm;
                    const urlDirect = regexDirectAtob.exec(content);
                    this.bar.stop();
                    resolve(atob(urlDirect[1]));
                } catch (error) {
                    reject(error);
                }
            }).catch((error) => {
                this.bar.stop();
                reject(error);
            });
        });
    }

    getLinegateUrl (urlLink) {
        return new Promise(async (resolve, reject) => {
            try {
                this.bar.update(10);
                const browser = await puppeteer.launch({
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
                browser.on('targetcreated', async () => {
                    const pages = await browser.pages();
                    try {
                        if (pages.length >= 3) {
                            const urlLinege = pages[2].url();
                            if (urlLinege){
                                browser.close();
                                return resolve(urlLinege);
                            }
                        }
                    } catch (e) { }
                });
                const page = await browser.newPage();
                page.setDefaultNavigationTimeout(0);
                await page.goto(urlLink);
                this.bar.update(30);
                const urlObject = new URL(page.url());
                const urlHost = urlObject.host;
                new Promise(r => setTimeout(r, 6000));
                await page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] });
                this.bar.update(40);
                if (urlHost === "intercelestial.com"){
                    new Promise(r => setTimeout(r, 8000));
                    await page.$eval("img[src='https://intercelestial.com/wp-content/uploads/2022/12/ok-lets-continue.png']", (el) => {
                        el.click()
                    });
                    await page.waitForNavigation();
                    new Promise(r => setTimeout(r, 8000));
                    this.bar.update(60);
                    await page.$eval("a[href='#generate']", (el) => {
                        el.click()
                    });
                    new Promise(r => setTimeout(r, 8000));
                    await page.$eval("img[src='https://intercelestial.com/wp-content/uploads/2022/12/download.png']", (el) => {
                        el.click()
                    });
                    new Promise(r => setTimeout(r, 8000));
                }else if (urlHost === "teknoasian.com"){
                    await scrollPageToBottom(page);
                    new Promise(r => setTimeout(r, 8000));
                    await page.$eval("img[src='https://teknoasian.com/wp-content/uploads/2023/09/ok-lets-continue.png']", (el) => {
                        el.click()
                    });
                    await page.waitForNavigation();
                    this.bar.update(60);
                    await scrollPageToBottom(page);
                    new Promise(r => setTimeout(r, 8000));
                    await page.$eval("img[src='https://teknoasian.com/wp-content/uploads/2023/09/download.png']", (el) => {
                        el.click()
                    });
                    new Promise(r => setTimeout(r, 8000));
                }
                this.bar.update(80);
            } catch (e) {
                this.bar.stop();
                return reject(e);
            }
        })
    } 
    
    isValidUrl(string) {
        try {
            const urlObject = new URL(string);
            const urlHost = urlObject.host;
            if (urlHost === 'pahe.in' || urlHost === 'pahe.ph' || urlHost === 'pahe.li') return true;
            return false;
        } catch (err) {
            return false;
        }
    }
}