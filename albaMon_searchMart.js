const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// 기본 URL과 페이지 수 설정
const baseUrl = 'https://www.albamon.com';
const searchUrl = `${baseUrl}/total-search?keyword=%EB%A7%88%ED%8A%B8+%EB%B0%B0%EC%86%A1&page=`;
const totalPages = 10; // 1~5페이지까지 가져오기

// 필터 조건
const includeRegion = ['서울', '경기']; // 지역에 포함된 값
const excludeKeywords = ['관리', '유통', '진열', '푸드', '주류', '축산', '수산', '컴퍼니']; // 제목에 포함된 키워드

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

// 각 공고 페이지에서 제목, 위치, 회사명, deadline 추출
const extractJobDetails = async (html) => {
    const $ = cheerio.load(html);
    const title = $('#__next > div > div.DefaultLayout_container__fWx2h > main > div.DefaultLayout_content__yfj55 > div.DefaultLayout_column--left__1C6jm > div > header > div > div:nth-child(1) > div:nth-child(1) > h1').text().trim();
    const martName = $('#__next > div > div.DefaultLayout_container__fWx2h > main > div.DefaultLayout_content__yfj55 > div.DefaultLayout_column--left__1C6jm > div > header > div > div:nth-child(1) > div.detail-recruit-base__company > span').text().trim();
    const location = $('#__next > div > div.DefaultLayout_container__fWx2h > main > div.DefaultLayout_content__yfj55 > div.DefaultLayout_column--left__1C6jm > div > div.DetailRecruitArea_detail-recruit-area__T6pv4 > p').text().trim();
    const deadline = $('#__next > div > div.DefaultLayout_container__fWx2h > main > div.DefaultLayout_content__yfj55.DefaultLayout_resolution--1030__XMj_4.DefaultLayout_column__m2sx4.DefaultLayout_margin-default__eyOmG > div.DefaultLayout_column--left__1C6jm > div > header > div > div:nth-child(1) > div:nth-child(1) > h1 > span').text().trim(); // deadline 추가

    return { title, martName, location, deadline };
};

// 공고 목록 페이지에서 각 공고의 링크와 ID 추출
const extractJobLinks = async (html) => {
    const $ = cheerio.load(html);
    const jobLinks = [];

    $('ul > li').each((index, element) => {
        const relativeLink = $(element).find('div.list-item-recruit__contents > a').attr('href');
        if (relativeLink) {
            // URL이 이미 https://www.albamon.com으로 시작하는지 확인하고, 없으면 추가
            const fullLink = relativeLink.startsWith('http') ? relativeLink : `${baseUrl}${relativeLink}`;
            jobLinks.push(fullLink);
        }
    });

    return jobLinks;
};

// 필터링된 공고 정보를 가져오는 함수
const filterJobDetails = (jobDetails) => {
    const { title, location } = jobDetails;

    // 지역에 포함된 값이 있어야 하고, 제목에 제외 키워드가 없어야 한다
    const hasIncludeRegion = includeRegion.some(region => location.includes(region));
    const hasExcludeKeywords = excludeKeywords.some(keyword => title.includes(keyword));

    // 지역이 포함되고 제외 키워드가 없는 경우만 필터링
    return hasIncludeRegion && !hasExcludeKeywords;
};

// 메인 함수
const main = async () => {
    try {
        const allJobDetails = [];

        for (let page = 1; page <= totalPages; page++) {
            console.log(`${page}페이지`);
            const searchHtml = await fetchHtml(`${searchUrl}${page}`);
            const jobLinks = await extractJobLinks(searchHtml);

            for (const jobLink of jobLinks) {
                const jobHtml = await fetchHtml(jobLink);
                const jobDetails = await extractJobDetails(jobHtml);

                // 필터링 조건을 만족하는 경우만 추가
                if (filterJobDetails(jobDetails)) {
                    jobDetails.link = jobLink; // 공고 링크 추가
                    allJobDetails.push(jobDetails);
                }
            }
        }

        // 결과 저장
        fs.writeFileSync('albaMon.json', JSON.stringify(allJobDetails, null, 2), 'utf8');
        console.log('끝');
    } catch (error) {
        console.error('Error:', error);
    }
};

main();
