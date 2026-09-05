export const SCHOOL_COLUMNS = ['排名','學校代碼','學校名稱','公私立','招生區','學制分類','男女校','縣市','區','地址','官網','電話','科系與名額','簡章招生名額','招生名額','分數來源備註','資優班/特色班','排序分數','課程方向','實習／專題','交通方式','通勤資訊','住宿資訊','生活資料來源','交通資料來源','住宿資料來源','Google地圖','地址資料來源','課程資料來源','實習專題資料來源'];
export function parseCsv(text) {
  const rows=[]; let row=[], value='', quoted=false;
  const input=text.replace(/^\uFEFF/,'');
  for(let i=0;i<input.length;i++) {
    const c=input[i];
    if(c==='"') { if(quoted && input[i+1]==='"'){value+='"';i++;} else if(!quoted && value || quoted && input[i+1] && ![',','\r','\n'].includes(input[i+1])) throw new Error('Malformed CSV quote'); else quoted=!quoted; }
    else if(c===','&&!quoted){row.push(value);value='';}
    else if((c==='\n'||c==='\r')&&!quoted){row.push(value);if(row.some(Boolean))rows.push(row);row=[];value='';if(c==='\r'&&input[i+1]==='\n')i++;}
    else value+=c;
  }
  if(quoted)throw new Error('Unclosed CSV quote');
  if(value||row.length){row.push(value);rows.push(row);}
  const headers=rows.shift()||[];
  return {headers,rows:rows.map((cells,index)=>{if(cells.length!==headers.length)throw new Error(`CSV row ${index+2}: ${cells.length} columns`);return Object.fromEntries(headers.map((h,i)=>[h,cells[i]]));})};
}
export function parseDepartments(raw) {
  const warnings=[];
  const departments=raw.split(/[；;]/).filter(s=>s.trim()).map(raw=>{
    const match=raw.trim().match(/^(.+?)[：:]\s*(\d+)(?:\s*[(（]([^()（）]+)[)）])?$/);
    if(!match){if(/[：:]/.test(raw))warnings.push(raw);return {name:raw.trim(),quota:null,gender:'',raw};}
    const nameGender=match[1].match(/^(.+?)[(（](男|女|不限|男女)[)）]$/);
    return {name:nameGender?nameGender[1]:match[1].trim(),quota:Number(match[2]),gender:match[3]||nameGender?.[2]||'',raw};
  });
  return {departments,warnings};
}
export function parseSources(raw) {
  return [...new Set(raw.match(/https?:\/\/[^\s;；]+/g)||[])].flatMap(url=>{try{const parsed=new URL(url);return [{url:parsed.href,label:'查看官方來源'}];}catch{return [];}});
}
export function informationStatus(text,kind='lodging') {
  if(!text.trim())return 'unclear';
  if(/不適用/.test(text))return 'not_applicable';
  if(kind==='lodging' && /(?:不設|未設|無|沒有)(?:置)?(?:校內)?(?:學生)?宿舍|未提供住宿|不提供住宿/.test(text))return 'not_offered';
  if(kind==='transport' && /(?:無|沒有|不提供|未設)(?:固定)?(?:學生專車|校車)/.test(text) && !/公車|捷運|火車|鐵路/.test(text))return 'not_offered';
  if(/未(?:標示|公布|公開|查得)|尚未公布|無法確認/.test(text))return 'not_published';
  if(kind==='lodging' && /宿舍|住宿/.test(text))return 'confirmed';
  if(kind==='transport' && /公車|捷運|火車|鐵路|客運|專車|校車|步行|搭乘/.test(text))return 'confirmed';
  return 'unclear';
}
export const renderField=value=>value?.trim()?value:'目前沒有資料';
export function validateData(master,admissions) {
  const errors=[],warnings=[];
  for(const [label,data,columns] of [['master',master,SCHOOL_COLUMNS],['admissions',admissions,['資料來源區',...SCHOOL_COLUMNS]]]) {
    if(JSON.stringify(data.headers)!==JSON.stringify(columns)) errors.push(`${label}: schema order mismatch`);
    data.rows.forEach((r,i)=>{
      const id=`${label}:${i+2}:${r['學校代碼']}`;
      for(const key of ['學校代碼','學校名稱','公私立','學制分類','男女校','縣市','招生區'])if(!r[key])errors.push(`${id}: missing ${key}`);
      if(!['高中','高職','綜高','進修部'].includes(r['學制分類']))errors.push(`${id}: invalid school type`);
      if(!['男校','女校','男女校'].includes(r['男女校']))errors.push(`${id}: invalid gender`);
      if(!['公立','私立'].includes(r['公私立']))errors.push(`${id}: invalid ownership`);
      if(!/^\d+[A-Za-z0-9_-]*$/.test(r['學校代碼']||''))warnings.push(`${id}: nonstandard code`);
      for(const key of ['官網','Google地圖',...SCHOOL_COLUMNS.filter(c=>c.endsWith('資料來源'))]) {
        if(!r[key])warnings.push(`${id}: missing ${key}`);
        else if(!parseSources(r[key]).length)warnings.push(`${id}: malformed URL ${key}`);
      }
      for(const entry of parseDepartments(r['科系與名額']||'').warnings)warnings.push(`${id}: department parsing: ${entry}`);
      if(!r['地址']||r['地址'].length<6)warnings.push(`${id}: malformed address`);
      else if(!r['地址'].replaceAll('台','臺').includes(r['縣市'].replaceAll('台','臺')))warnings.push(`${id}: city/address mismatch`);
      if(r['排名'])warnings.push(`${id}: ranking unexpectedly populated`);
    });
  }
  const codes=master.rows.map(r=>r['學校代碼']);
  for(const code of new Set(codes))if(codes.filter(c=>c===code).length>1)errors.push(`duplicate school code: ${code}`);
  for(const r of admissions.rows)if(!codes.includes(r['學校代碼']))errors.push(`orphan admission: ${r['學校代碼']}`);
  for(const r of master.rows){const related=admissions.rows.filter(a=>a['學校代碼']===r['學校代碼']);if(!related.length)errors.push(`missing admission: ${r['學校代碼']}`);}
  return {errors,warnings};
}
export function normalizeSchool(raw,relations) {
  const get=k=>raw[k]||'';
  const admissionRecords=relations.map((r,i)=>({id:`${get('學校代碼')}:${r['資料來源區']}:${i}`,sourceDistrict:r['資料來源區'],admissionDistrict:r['招生區'],admissionOfferingType:r['學制分類'],departmentRaw:r['科系與名額'],departments:parseDepartments(r['科系與名額']).departments,brochureQuota:r['簡章招生名額'],admissionQuota:r['招生名額'],raw:r}));
  return {code:get('學校代碼'),name:get('學校名稱'),ownership:get('公私立'),admissionDistrict:get('招生區'),admissionDistricts:[...new Set(relations.map(r=>r['招生區']))],schoolType:get('學制分類'),gender:get('男女校'),city:get('縣市'),area:get('區'),address:get('地址'),website:get('官網'),phone:get('電話'),departmentRaw:get('科系與名額'),departments:parseDepartments(get('科系與名額')).departments,brochureQuota:get('簡章招生名額'),admissionQuota:get('招生名額'),scoreNote:get('分數來源備註'),features:get('資優班/特色班'),courseDirection:get('課程方向'),project:get('實習／專題'),transport:get('交通方式'),commute:get('通勤資訊'),lodging:get('住宿資訊'),mapUrl:get('Google地圖'),sources:Object.fromEntries([['address','地址資料來源'],['transport','交通資料來源'],['lodging','住宿資料來源'],['course','課程資料來源'],['project','實習專題資料來源'],['life','生活資料來源']].map(([k,v])=>[k,parseSources(get(v))])),lodgingStatus:informationStatus(get('住宿資訊')),transportStatus:informationStatus(get('交通方式'),'transport'),hasSchoolBus:/(?:提供|設有|搭乘|學生專車|校車)/.test(get('交通方式'))&& !/未標示.*(?:專車|校車)|無校車|無學生專車/.test(get('交通方式')) && /專車|校車/.test(get('交通方式')),hasPublicTransport:/公車|捷運|火車|客運|鐵路/.test(get('交通方式'))&&!/未標示完整/.test(get('交通方式')),academicYear:'115',raw,admissionRecords};
}
export function normalizeSearch(value){return value.normalize('NFKC').toLocaleLowerCase().replaceAll('台','臺').replace(/\s+/g,'');}
export function searchSchoolRecords(schools,query='',filters={}) {
  const terms=query.trim().split(/\s+/).filter(Boolean).map(normalizeSearch);
  return schools.filter(s=>{
    for(const key of ['city','area','ownership','schoolType','gender'])if(filters[key]&&s[key]!==filters[key])return false;
    if(filters.admissionDistrict&&!s.admissionDistricts.includes(filters.admissionDistrict))return false;
    if(filters.department&&!s.departments.some(d=>d.name===filters.department))return false;
    if(filters.lodging&&s.lodgingStatus!=='confirmed')return false;
    if(filters.schoolBus&&!s.hasSchoolBus)return false;
    if(filters.publicTransport&&!s.hasPublicTransport)return false;
    const text=normalizeSearch([s.code,s.name,s.name.replace(/高級中等學校|高級中學/g,'高中').replace(/國立|市立|縣立|私立/g,''),s.city,s.area,s.admissionDistrict,s.schoolType,s.departmentRaw,s.features,s.courseDirection,s.project,s.transport,s.lodging].join(' '));
    return terms.every(t=>text.includes(t)||(t==='ai'&&text.includes('人工智慧'))||(t==='餐飲'&&/餐旅|烘焙/.test(text)));
  });
}
