
const fs = require('fs');
const googleTrends = require('google-trends-api');
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// 사용자로부터 검색어 입력 받기
rl.question('검색어를 입력하세요: ', (keyword) => {
    // 특정 키워드에 대한 지역별 관심도 조회
    googleTrends.interestByRegion({ keyword: keyword })
        .then((response) => {
            const data = JSON.parse(response);
            console.log(`'${keyword}'에 대한 지역별 관심도:`);
            console.log(data);
        })
        .catch((error) => {
            console.error('지역별 관심도를 가져오는 중 오류 발생:', error);
        });

    // 특정 키워드에 대한 관련된 주제 조회
    googleTrends.relatedTopics({ keyword: keyword })
        .then((response) => {
            const data = JSON.parse(response);
            console.log(`'${keyword}'에 대한 관련된 주제:`);
            console.log(data);
        })
        .catch((error) => {
            console.error('관련된 주제를 가져오는 중 오류 발생:', error);
        });

    // 특정 키워드와 관련된 검색어 조회
    googleTrends.relatedQueries({ keyword: keyword })
        .then((response) => {
            const data = JSON.parse(response);
            console.log(`'${keyword}'와 관련된 검색어:`);
            console.log(data);
        })
        .catch((error) => {
            console.error('관련된 검색어를 가져오는 중 오류 발생:', error);
        });

    rl.close();
});
