const puppeteer = require ('puppeteer');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
require('dotenv').config();

const csvWriter = createCsvWriter({
  path: './courses.csv',
  header: [
    {id: 'course', title: 'Course'},
    {id: 'author', title: 'Author'},
    {id: 'completion', title: 'Completion'},
    {id: 'url', title: 'URL'}
  ]
});

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

      csvWriter.writeRecords(courses)
        .then(() => console.log('Courses CSV written successfully'))
        .catch(error => console.error(error))

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

    await page.waitForSelector('.card--learning__details');

    const newCourses = await page.evaluate(() => {
      let coursesOnPage = [];
      const courseNodes = document.body.querySelectorAll('a.card--learning__details');

      courseNodes.forEach(course => {
        const progress = course.querySelector('.progress__text')
          ? parseInt(String(course.querySelector('.progress__text').textContent).split('%')[0])
          : 0;
        coursesOnPage.push({
          course: String(course.querySelector('.details__name').textContent),
          author: String(course.querySelector('.details__instructor').textContent),
          completion: progress,
          url: String(course.href),
        })
      });

      return coursesOnPage;
    });

    courses = [...courses, ...newCourses];
  }

  return courses;
}
