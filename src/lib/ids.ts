export const normalizeOfficeId = (idLike: string | number) =>
  Number(String(idLike).replace(/^0+/, "")) || 0;

