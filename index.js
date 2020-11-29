const puppeteer = require ('puppeteer');
require('dotenv').config();

puppeteer
  .launch({
    headless: false,
    userDataDir: './cache'
  })
  .then(
    async browser => {
      const page = await browser.newPage();
      let pageCount = 1;
      let courses = [];
      await page.goto('https://www.udemy.com/home/my-courses/learning/', {timeout: 0, waitUntil: 'networkidle2'});

      page.on('response', async (response) => {
        if ((response.status >= 300) && (response.status < 400)) {
          await page.waitForSelector('input[name=email]');
          await page.type('input[name=email]', process.env.USERNAME);
          await page.type('input[name=password]', process.env.PASSWORD);
          await page.click('input[name=submit]');
          await page.waitForNavigation({ waitUntil: "networkidle2" });
        }
      })

      await page.waitForSelector('.pagination');
      pageCount = await page.evaluate(() => {
        const pagination = Array.from(document.querySelector('.pagination').childNodes);
        return parseInt(pagination.slice(-2)[0].textContent);
      })

      courses = await scrapeCourses(page, pageCount);
      console.log(courses);

      await browser.close();
    }
  ).catch(error => console.error(error));

async function scrapeCourses (page, pageCount) {
  let courses = [];
  for (let i = 1; i <= pageCount; i++) {
    if (i > 1) {
      await page.goto(
        `https://www.udemy.com/home/my-courses/learning/?p=${i}`,
        { waitUntil: "networkidle2" }
      );
    }

    await page.waitForSelector('.card-wrapper');
    await page.evaluate(() => {
      let courseObjects = document.body.querySelectorAll ('.a.card--learning__details');

      courseObjects.forEach(course => {
        courses.push({
          url: course.href,
          title: course.querySelector('.details__name'),
          author: course.querySelector('.details__instructor'),
          completion: course.querySelector('.progress__text')
        })
      });
    });
  }

  return courses;
}