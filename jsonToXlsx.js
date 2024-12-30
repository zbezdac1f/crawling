const XLSX = require('xlsx');
const fs = require('fs');

const jsonToXlsx = () => {
    try {
        if (!fs.existsSync('martJobCrawling.json')) {
            console.log('파일이 존재하지 않습니다.');
            return;
        }

        const data = JSON.parse(fs.readFileSync('martJobCrawling.json', 'utf8')); // JSON 읽기
        console.log('JSON 데이터:', data); // 데이터 확인

        // 워크북 생성
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(data);

        // 워크시트 추가
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Job Data');

        // 엑셀 파일로 저장
        XLSX.writeFile(workbook, 'martJobResult.xlsx');
        console.log('엑셀 파일 저장완료');
    } catch (error) {
        console.error('오류 발생:', error);
    }
};

module.exports = jsonToXlsx;
