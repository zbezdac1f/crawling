const main = require('./martjob_searchMart.js').main;
const jsonToXlsx = require('./jsonToXlsx.js');
const sendEmail = require('./mailer.js');
const schedule = require('node-schedule');

const fullAutomation = async () => {
    try {
        console.log('크롤링 작업 시작...');
        await main();

        console.log('JSON을 엑셀로 변환 중...');
        jsonToXlsx();

        console.log('엑셀 파일 이메일로 전송 중...');
        await sendEmail();

        console.log('전체 작업 완료!');
    } catch (error) {
        console.error('자동화 작업 실패:', error);
    }
};

// 매주 월요일 오전 9시에 실행
schedule.scheduleJob('0 9 * * 1', fullAutomation);
