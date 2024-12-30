const nodemailer = require('nodemailer');

const sendEmail = async () => {
    const transporter = nodemailer.createTransport({
        service: 'gmail', // 사용 중인 이메일 서비스 (예: Gmail)
        auth: {
            user: 'lucas1234574@gmail.com', // 발신자 이메일
            pass: 'your-email-password', // 발신자 비밀번호 또는 앱 비밀번호
        },
    });

    const mailOptions = {
        from: 'lucas1234574@gmail.com',
        to: 'lucas1234574@gmail.com', // 수신자 이메일
        subject: '마트 잡 키워드 크롤링 결과',
        text: '1주일간의 크롤링 결과입니다. 첨부 파일을 확인해주세요.',
        attachments: [
            {
                filename: 'martJobKeyword.xlsx',
                path: './martJobKeyword.xlsx', // 첨부 파일 경로
            },
        ],
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('이메일 전송 성공!');
    } catch (error) {
        console.error('이메일 전송 실패:', error);
    }
};

module.exports = sendEmail;
