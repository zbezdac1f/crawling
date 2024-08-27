const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const router = require('express').Router();

// 기본 URL과 페이지 수
const baseUrl = 'https://www.martjob.co.kr/job/guin.asp';
const totalPages = 17;  // 테스트를 위해 페이지 수를 1로 설정

// HTML을 가져오는 함수
const fetchHtml = async (url) => {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`Error fetching the HTML:`, error);
        throw error;
    }
};

// 공고 페이지에서 worktime 정보를 추출하는 함수
const extractWorkTime = async (jobUrl) => {
    try {
        const jobHtml = await fetchHtml(jobUrl);
        const $ = cheerio.load(jobHtml);

        // 'worktime' 정보를 해당 CSS 선택자로 추출
        const worktimeText = $('#containerWrap > div:nth-child(6) > div').text().trim();

        // '근무시간 |' 이 포함된 부분만 추출
        const worktime = worktimeText.split('근무시간 |')[1]?.split('\n')[0]?.trim() || 'Not available';

        return worktime;
    } catch (error) {
        console.error(`Error extracting work time from ${jobUrl}:`, error);
        return 'Error fetching work time'; // 에러 발생시 에러 메시지 반환
    }
};

// 공고 페이지에서 전화번호를 추출하는 함수
const extractPhoneNumber = async (jobUrl) => {
    try {
        const jobHtml = await fetchHtml(jobUrl);
        const $ = cheerio.load(jobHtml);

        // 전화번호 정보를 해당 CSS 선택자로 추출
        const phoneNumberText = $('#containerWrap > div:nth-child(10) > span.disflex.flexv-column.g-table.w100 > span:nth-child(2) > span:nth-child(2)').text().trim();

        return phoneNumberText || 'Not available';
    } catch (error) {
        console.error(`Error extracting phone number from ${jobUrl}:`, error);
        return 'Error fetching phone number'; // 에러 발생시 에러 메시지 반환
    }
};

// 공고 페이지에서 임금 정보를 추출하는 함수
const extractSalary = async (jobUrl) => {
    try {
        const jobHtml = await fetchHtml(jobUrl);
        const $ = cheerio.load(jobHtml);

        // '임금' 정보를 해당 CSS 선택자로 추출
        const salaryText = $('#containerWrap > div:nth-child(6) > div > font:nth-child(10)').text().trim();
        const salary = salaryText.split('임금조건 |')[1]?.trim() || 'Not available';

        return salary || 'Not available';
    } catch (error) {
        console.error(`Error extracting salary from ${jobUrl}:`, error);
        return 'Error fetching salary'; // 에러 발생시 에러 메시지 반환
    }
};

// 공고 페이지에서 근무 위치 정보를 추출하는 함수
const extractWorkLocation = async (jobUrl) => {
    try {
        const jobHtml = await fetchHtml(jobUrl);
        const $ = cheerio.load(jobHtml);

        // 근무 위치 정보를 해당 CSS 선택자로 추출
        const workLocationText = $('#containerWrap > div:nth-child(10) > span.disflex.flexv-column.g-table.w100 > span.disflex.flexv-top.mt10 > span:nth-child(2)').text().trim();

        return workLocationText || 'Not available';
    } catch (error) {
        console.error(`Error extracting work location from ${jobUrl}:`, error);
        return 'Error fetching work location'; // 에러 발생시 에러 메시지 반환
    }
};

// HTML에서 구인공고의 제목, 위치, 회사명을 추출하는 함수
const extractJobDetails = async (html) => {
    const $ = cheerio.load(html);
    const jobDetails = [];

    const promises = $('#lists tr').map(async (i, element) => {
        const deadline = $(element).find('td:nth-child(6)').text().trim();
        const martSize = $(element).find('td:nth-child(5)').text().trim();

        // martName gconame span에서 추출
        const rowId = $(element).attr('id');
        const martName = $(`#${rowId} > td:nth-child(3) > span.gconame > span`).text().trim();

        // 회사명 위치 수정
        const location = $(element).find('td:nth-child(2)').text().trim();
        const titleElement = $(element).find('td:nth-child(3) a');
        const title = titleElement.text().trim();
        const link = titleElement.attr('href');
        const fullLink = `https://www.martjob.co.kr/${link}`;

        // 필터링된 키워드 목록
        const excludeKeywords = ['관리', '유통', '관리 진열'];
        const includeKeywords = ['배송', '배달'];

        // title이 포함 또는 제외 키워드에 따라 필터링
        const shouldExclude = excludeKeywords.some(keyword => title.includes(keyword));
        const shouldInclude = includeKeywords.some(keyword => title.includes(keyword));

        if (title && !shouldExclude && shouldInclude) {
            const worktime = await extractWorkTime(fullLink); // 각 공고의 worktime 추출
            const phoneNumber = await extractPhoneNumber(fullLink); // 각 공고의 전화번호 추출
            const salary = await extractSalary(fullLink); // 각 공고의 임금 추출
            const workLocation = await extractWorkLocation(fullLink); // 각 공고의 근무 위치 추출

            if (worktime !== 'Not available') {
                jobDetails.push({
                    martName: martName,       // gconame에서 추출한 텍스트
                    deadline: deadline,       // 수정일
                    location: location,       // 회사명
                    title: title,             // 채용제목
                    martSize: martSize,       // 생성일
                    worktime: worktime,       // 근무 시간
                    phoneNumber: phoneNumber, // 전화번호
                    salary: salary,           // 임금
                    work_location: workLocation, // 근무 위치
                    link: fullLink            // 채용공고 링크
                });
            }
        }
    }).get();  // .map()의 결과를 배열로 변환

    await Promise.all(promises);

    return jobDetails;
};

// 메인 함수
const main = async () => {
    try {
        const allJobDetails = [];

        // 페이지를 반복하여 데이터 수집
        for (let page = 9; page <= totalPages; page++) {
            console.log(`Fetching data from page ${page}...`);
            const html = await fetchHtml(`${baseUrl}?fset=job-118&listorder=&aream=&areagum=&jobcode=08&midkeyw=&gubunchk=0&grade=&areacode0=&areagu_code0=&listRow=30&page=${page}`);
            const jobDetails = await extractJobDetails(html);
            allJobDetails.push(...jobDetails);
        }

        // 결과를 파일에 저장
        fs.writeFileSync('martCrling_onlyShipping2.json', JSON.stringify(allJobDetails, null, 2), 'utf8');
        console.log('끝');
    } catch (error) {
        console.error('Error:', error);
    }
};

main();

module.exports = router;
