const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// 기본 URL 설정 (페이지 번호는 동적으로 추가됩니다)
const baseUrl = 'https://www.jobkorea.co.kr/Search/?stext=부품배송&tabType=recruit&Page_No=';
const totalPages = 3; // 크롤링할 총 페이지 수

// HTML을 가져오는 함수
const fetchHtml = async (url) => {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`Error fetching HTML from ${url}:`, error);
        throw error;
    }
};

// 공고 목록에서 제목, 회사 이름, 지역을 추출하는 함수
const extractJobList = async (html) => {
    const $ = cheerio.load(html);
    const jobList = [];

    // 리스트에서 각 공고의 정보를 추출
    $('#dev-content-wrap > article > section.content-recruit.on > article.list > article').each((index, element) => {
        const title = $(element)
            .find('div.list-section-information > div > a')
            .text()
            .trim();
        const companyName = $(element)
            .find('div.list-section-corp > a')
            .text()
            .trim(); // 회사 이름을 새로 지정된 셀렉터에서 가져옴
        const region = $(element)
            .find('div.list-section-information > ul > li:nth-child(4)')
            .text()
            .trim();
        const deadline = $(element)
            .find('div.list-section-information > ul > li:nth-child(5)')
            .text()
            .trim(); // 마감일 정보 추출
        const link = $(element)
            .find('div.list-section-information > div > a')
            .attr('href') || ''; // 공고의 링크 추출


        // 링크가 상대경로로 제공되므로, 기본 URL을 결합하여 절대경로로 만듬
        const jobLink = link.startsWith('http') ? link : `https://www.jobkorea.co.kr${link}`;

        jobList.push({ companyName, title, deadline, region, jobLink });
    });

    return jobList;
};

// 실행 함수
const main = async () => {
    try {
        const allJobDetails = [];

        // totalPages 만큼 반복하여 각 페이지의 데이터를 가져옴
        for (let page = 1; page <= totalPages; page++) {
            console.log(`${page}페이지`);
            const html = await fetchHtml(`${baseUrl}${page}`);
            const jobDetails = await extractJobList(html);

            // 각 페이지에서 추출한 데이터 모두 추가
            allJobDetails.push(...jobDetails);
        }

        // 결과를 JSON 파일로 저장
        const filePath = './jobKoreaResults.json';
        fs.writeFileSync(filePath, JSON.stringify(allJobDetails, null, 2), 'utf8');
        console.log('완료');
    } catch (error) {
        console.error('Error:', error);
    }
};

main();
