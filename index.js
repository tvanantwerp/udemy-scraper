const puppeteer = require ('puppeteer');

puppeteer
  .launch()
  .then(
    async browser => {
      const page = await browser.newPage ();
      let nextPage = 1;
      let courses = [];
      await page.goto('https://www.udemy.com/join/login-popup/', { waitUntil: "networkidle0" });
      await page.type('#email--1', 'username');
      await page.type('#id_password', 'password');
      await page.click('#submit-id-submit');
      await page.waitForNavigation({ waitUntil: "networkidle0" });

      while(nextPage) {
        await page.goto(`https://www.udemy.com/home/my-courses/learning/?p=${nextPage}`, { waitUntil: "networkidle0" });
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

          const pagination = Array.from(querySelector('.pagination').childNodes);
          const finalPage = pagination.slice(-1)[0].classList.contains("disabled")
          if (finalPage) {
            nextPage = null;
          } else {
            nextPage +=1;
          }
        })
      }

      await browser.close ();
    }
  ).catch (function (err) {
    console.error (err);
  });
