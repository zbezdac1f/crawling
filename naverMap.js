const fs = require('fs');  // Node.js 파일 시스템 모듈
const axios = require('axios');  // HTTP 요청을 위한 axios 모듈
const cheerio = require('cheerio');  // HTML 파싱을 위한 cheerio 모듈
const readline = require('readline');  // 입력을 받기 위한 readline 모듈

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// URL 생성 함수
const createUrl = (keyword) => {
    return `https://map.naver.com/p/api/search/instant-search?query=${keyword}&coords=37.47711940000001,126.96762287489713`;
};

// HTML 데이터를 가져오는 함수
const fetchData = async (url) => {
    try {
        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            }
        });
        return response.data;  // 응답 데이터를 반환
    } catch (error) {
        console.error(error);  // 오류 발생 시 콘솔에 출력
    }
};

// HTML 데이터를 파싱하여 필요한 정보를 추출하는 함수
const parseData = (html) => {
    const $ = cheerio.load(html);  // cheerio를 사용해 HTML 데이터를 로드
    const name = $('.search_item .title').first().text().trim();  // 검색 결과의 첫 번째 항목의 이름 추출
    const rate = $('.search_item .rating').first().text().trim();  // 검색 결과의 첫 번째 항목의 평점 추출
    return { name, rate };  // 짜장면집 이름이랑 별점만 가져오기 
};

// 크롤링을 실행
const crawlData = async (keyword) => {
    const url = createUrl(keyword);  // URL 생성
    const html = await fetchData(url);  // HTML 데이터 가져오기
    const result = parseData(html);  // HTML 데이터를 파싱하여 필요한 정보를 추출
    console.log(result);
    fs.writeFileSync('result.txt', JSON.stringify(result, null, 2));  // 결과를 파일에 저장
};

// 사용자로부터 검색어를 입력받고 크롤링을 실행
rl.question("검색어를 입력해주세요: ", (keyword) => {
    crawlData(keyword);  // 크롤링 함수 호출
    rl.close();
});
