const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// 기본 URL과 페이지 수
const baseUrl = 'http://search.findjob.co.kr/?kw=%uB9C8%uD2B8%20%uBC30%uC1A1';
const totalPages = 5;  // 10페이지까지 크롤링

// HTML을 가져오는 함수
const fetchHtml = async (url) => {
    try {
        const response = await axios.get(url, {
            maxRedirects: 5 // 리다이렉션 허용
        });
        return { data: response.data, finalUrl: response.request.res.responseUrl };
    } catch (error) {
        console.error(`Error fetching the HTML:`, error);
        throw error;
    }
};

// 개별 공고 페이지에서 상세주소와 전화번호를 추출하는 함수
const extractAdditionalDetails = async (jobUrl) => {
    try {
        const { data: jobHtml } = await fetchHtml(jobUrl);
        const $ = cheerio.load(jobHtml);

        // 상세주소 추출
        const address = $('#changeAddress > span > strong').text().trim() || 'Not available';

        // 전화번호 추출
        const phoneNumber = $('#changeDoc > span').text().trim() || 'Not available';

        return {
            address,
            phoneNumber,
        };
    } catch (error) {
        console.error(`Error extracting additional details from ${jobUrl}:`, error);
        return {
            address: 'Error fetching address',
            phoneNumber: 'Error fetching phone number',
        };
    }
};

// HTML에서 각 구인공고의 정보(근무지역, 마트 이름, 제목, 업무시간)를 추출하는 함수
const extractJobDetails = async (html) => {
    const $ = cheerio.load(html);
    const jobDetails = [];

    const promises = $('#result_adList > tr').map(async (i, element) => {
        // 근무지역 추출
        const workLocation = $(element).find('td.area.first > div > span').text().trim();

        // 마트 이름 추출
        const martName = $(element).find('td.sbj > div > a').text().trim();

        // 제목 추출
        const title = $(element).find('td.sbj > div > span > a').text().trim();

        // 업무시간 추출
        const workTime = $(element).find('td.sbj > div > div > span.first').text().trim();

        // const excludeKeywords = ['관리', '유통', '관리 진열'];
        // const includeKeywords = ['배송', '배달'];
        // // title이 포함 또는 제외 키워드에 따라 필터링
        // const shouldExclude = excludeKeywords.some(keyword => title.includes(keyword));
        // const shouldInclude = includeKeywords.some(keyword => title.includes(keyword));

        // if (workLocation && martName && title && workTime && !shouldExclude && shouldInclude)

        // 개별 공고 링크 추출 (JavaScript 함수를 포함한 URL 처리)
        const jobLink = $(element).find('td.sbj > div > a').attr('href');

        const excludeKeywords = ['관리', '유통', '진열', '푸드', '주류', '축산', '수산', '컴퍼니'];
        const includeRegion = ['서울', '경기']
        const shouldExclude = excludeKeywords.some(keyword => title.includes(keyword) || martName.includes(keyword))
        const shouldIncludedRegion = includeRegion.some(keyword => workLocation.includes(keyword))

        if (jobLink && !shouldExclude && shouldIncludedRegion) {
            const fullLinkMatch = jobLink.match(/GoAdDetail\('([^']+)'/); // 올바른 URL을 추출
            const fullLink = fullLinkMatch ? fullLinkMatch[1] : null;

            if (fullLink && workLocation && martName && title && workTime && shouldIncludedRegion) {
                const { address, phoneNumber } = await extractAdditionalDetails(fullLink);

                jobDetails.push({
                    martName,
                    workLocation,
                    title,
                    workTime,
                    // address,
                    // phoneNumber,
                    link: fullLink
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
        for (let page = 1; page <= totalPages; page++) {
            console.log(`${page}페이지...`);
            const { data: html } = await fetchHtml(`${baseUrl}&page=${page}`);
            const jobDetails = await extractJobDetails(html);
            allJobDetails.push(...jobDetails);
        }

        // 결과를 파일에 저장
        fs.writeFileSync('byorook1.json', JSON.stringify(allJobDetails, null, 2), 'utf8');
        console.log('끝');
    } catch (error) {
        console.error('Error:', error);
    }
};

main();
