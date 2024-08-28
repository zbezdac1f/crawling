const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// 기본 URL과 페이지 수
const baseUrl = 'http://search.findjob.co.kr/?kw=%uB9C8%uD2B8%20%uBC30%uC1A1';
const totalPages = 6;  // 5페이지까지 크롤링

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

// HTML에서 각 구인공고의 정보(근무지역, 마트 이름, 제목, 업무시간)를 추출
const extractJobDetails = async (html) => {
    const $ = cheerio.load(html);
    const jobDetails = [];

    $('#result_adList > tr').each((i, element) => {
        // 근무지역 추출
        const workLocation = $(element).find('td.area.first > div > span').text().trim();

        // 마트 이름 추출
        const martName = $(element).find('td.sbj > div > a').text().trim();

        // 제목 추출
        const title = $(element).find('td.sbj > div > span > a').text().trim();

        // 업무시간 추출
        const workTime = $(element).find('td.sbj > div > div > span.first').text().trim();

        // 필터링된 키워드 목록
        const excludeKeywords = ['관리', '유통', '관리 진열'];
        const includeKeywords = ['배송', '배달'];

        // title이 포함 또는 제외 키워드에 따라 필터링
        const shouldExclude = excludeKeywords.some(keyword => title.includes(keyword));
        const shouldInclude = includeKeywords.some(keyword => title.includes(keyword));

        if (workLocation && martName && title && workTime && !shouldExclude && shouldInclude) {
            jobDetails.push({
                workLocation: workLocation,
                martName: martName,
                title: title,
                workTime: workTime,
            });
        }
    });

    return jobDetails;
};

// 메인 함수
const main = async () => {
    try {
        const allJobDetails = [];

        // 페이지를 반복하여 데이터 수집
        for (let page = 1; page <= totalPages; page++) {
            console.log(` ${page} 진행중`);
            const html = await fetchHtml(`${baseUrl}&page=${page}`);
            const jobDetails = await extractJobDetails(html);
            allJobDetails.push(...jobDetails);
        }

        // 결과를 파일에 저장
        fs.writeFileSync('byorook_onlyShipping.json', JSON.stringify(allJobDetails, null, 2), 'utf8');
        console.log('끝');
    } catch (error) {
        console.error('Error:', error);
    }
};

main();
