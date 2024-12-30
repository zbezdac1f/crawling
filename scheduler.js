// const schedule = require('node-schedule');
// const main = require('./martjob_searchMart').main; // 크롤링 함수 가져오기

// // 매주 월요일 오전 9시에 실행
// schedule.scheduleJob('0 9 * * 1', async () => {
//     console.log("크롤링 작업 시작...");
//     await main();
//     console.log("크롤링 작업 완료!");
// });


// const schedule = require('node-schedule')
// const main = require('./martjob_searchMart').main; // 크롤링 함수 가져오기

// // 크롤링 작업을 바로 실행
// (async () => {
//     console.log("크롤링 작업 시작...");
//     await main();
//     console.log("크롤링 작업 완료!");
// })();


const schedule = require('node-schedule');
const main = require('./martjob_searchMart').main; // 크롤링 함수 가져오기

// 10초 후에 실행되도록 설정
const date = new Date(new Date().getTime() + 10 * 1000); // 현재 시간 + 10초

schedule.scheduleJob(date, async () => {
    console.log("크롤링 작업 시작...");
    await main();
    console.log("크롤링 작업 완료!");
});
