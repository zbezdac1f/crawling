const fs = require('fs');  // Node.js의 파일 시스템 모듈(fs)을 불러온다.
const axios = require('axios');  // HTTP 요청을 만들기 위한 axios 모듈을 불러온다.
const cheerio = require('cheerio');  //cheerio 모듈을 불러옴

const startGoodsNo = 1000003410;  // 시작 상품 번호
const endGoodsNo = 1000003410;    // 종료 상품 번호

// 지정된 URL에서 HTML 데이터를 가져오는 함수임.
async function list(page = 1) {
    const results = await axios.get(encodeURI(`https://www.furnituremall.co.kr/goods/goods_list.php?page=${page}&cateCd=001`),
        {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            }
        }
    ).then(res => res.data)
    const $ = cheerio.load(results);  // cheerio를 사용해 HTML 데이터를 로드한다.
    const list = $('#contents > div > div > div.goods_list_item > div.goods_list > div > div.item_basket_type.item_linenum5.item_notslide')
    const count = []
    list.children().each((i, elem) => {
        // console.log($(elem).find('div > div.item_info_cont > a').attr('href').split('goodsNo=').pop())
        count.push($(elem).find('div > div.item_info_cont > a').attr('href'))
    })
    console.log(count)
    return results
}

console.log(list(18))
const fetchData = async (url) => {
    try {
        const response = await axios.get(url);  // axios를 사용해 HTTP GET 요청을 보낸다.
        return response.data;  // 응답으로 받은 HTML 데이터를 반환한다.
    } catch (error) {
        console.error(error);  // 오류 발생 시 콘솔에 오류 메시지를 출력한다.
    }
};

// HTML 데이터를 파싱하여 필요한 정보를 추출하는 함수
const parseData = (html) => {
    const $ = cheerio.load(html);  // cheerio를 사용해 HTML 데이터를 로드한다.

    // Cheerio를 사용하여 필요한 정보 추출
    const name = $('#contents > div > div.content_box > div.item_goods_sec > div:nth-child(1) > div.detail_cont > div.detail_info_box > div > table > tbody > tr:nth-child(1) > td').text().trim();
    const sizeInfo = $('#contents > div > div.content_box > div.item_goods_sec > div:nth-child(1) > div.detail_cont > div.detail_info_box > div > table > tbody > tr:nth-child(8) > td').text().trim();
    const installPrice = $('#contents > div > div.content_box > div.item_goods_sec > div:nth-child(1) > div.detail_cont > div.detail_info_box > div > table > tbody > tr:nth-child(9) > td').text().trim();
    return { name, sizeInfo, installPrice };  // 추출한 정보를 객체로 반환한다.
};

// 지정된 범위의 상품들을 순회하며 정보를 수집하는 함수
const crawlPages = async () => {
    const results = [];  // 수집한 정보를 저장할 배열

    for (let currentGoodsNo = startGoodsNo; currentGoodsNo >= endGoodsNo; currentGoodsNo--) {
        const url = `https://www.furnituremall.co.kr/goods/goods_view.php?goodsNo=${currentGoodsNo}`;  // 현재 상품의 URL을 생성한다.
        const html = await fetchData(url);  // 상품의 데이터를 가져옴
        const result = parseData(html);    // HTML 데이터를 파싱하여 정보를 추출
        results.push(result);              // 추출한 정보를 배열에 추가

        // 대기 시간 (1000ms)을 설정함. 적당한 시간을 둬야함.
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 결과를 파일로 저장
    fs.writeFileSync('result.txt', JSON.stringify(results, null, 2));  // 추출한 정보를 JSON 형식으로 파일에 저장한다.
};

crawlPages();  // 함수 호출.