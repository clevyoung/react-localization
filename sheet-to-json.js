const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');

require('dotenv').config();

(async function () {
  // 시트 초기화 - Sheet URL에 있는 docID 입력
  const doc = new GoogleSpreadsheet(process.env.DOC_ID);

  // 인증 초기화
  await doc.useServiceAccountAuth({
    client_email: process.env.CLIENT_EMAIL,
    private_key: process.env.PRIVATE_KEY.replace(/\\n/gm, '\n'),
  });

  await doc.loadInfo();

  const sheets = await Object.values(doc._rawSheets);

  // 지원하는 언어 - 한국어, 영어, 중국어, 일본어
  const supportedLang = ['ko-KR', 'en-US', 'zh-CN', 'ja-JP'];

  for await (let sheet of sheets) {
    // 숨김 처리된 시트는 스크립트를 실행하지 않음
    if (!sheet._rawProperties.hidden) {
      const rows = await sheet.getRows();

      supportedLang.forEach((lang) => {
        const obj = rows.reduce((acc, cur) => {
          return { ...acc, ...{ [cur.key]: cur[lang] } };
        }, {});

        const data = JSON.stringify(obj);

        // json파일 저장 위치
        const dir = `public/assets/locales/${lang}`;

        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // 동기식으로 파일 쓰기(writeFileSync)
        fs.writeFileSync(`${dir}/${sheet.title}.json`, data);
      });
    }
  }
})();
