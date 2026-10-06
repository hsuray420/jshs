export const DEFAULT_POPULAR_SCHOOLS: Record<string, string[]> = {
  tp: ["353301", "353303", "330301", "353302"], // 建中、北一女、師大附中、成功高中
  ct: ["193302", "193301", "060322", "060323"], // 臺中一中、臺中女中、興大附中、中科實中
  kaohsiung: ["553301", "573301", "120303", "120319"], // 高雄中學、高雄女中、鳳山高中、鳳新高中
  "taoyuan-lienchiang": ["033306", "030305", "033304", "033327"], // 武陵、中壢、桃高、內壢
  "hsinchu-miaoli": ["180301", "180309", "180302", "180404"], // 竹科實中、新竹高中、新竹女中、新竹高工
  changhua: ["070307", "070301", "070401", "070304"], // 彰中、彰女、彰師附工、員林高中
  tainan: ["210305", "210306", "210303", "210309"], // 南一中、南女、南二中、家齊高中
  all: ["353301", "353303", "193302", "553301", "210305", "033306", "180301"],
};

export function resolvePopularSchoolsForRegion(
  map: Record<string, string[]>,
  regionId: string,
): string[] {
  const custom = map[regionId];
  if (Array.isArray(custom) && custom.length > 0) return custom;
  const def = DEFAULT_POPULAR_SCHOOLS[regionId];
  if (Array.isArray(def) && def.length > 0) return def;
  return DEFAULT_POPULAR_SCHOOLS.all || [];
}
