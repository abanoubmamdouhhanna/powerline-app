export const getPagination = (query) => {
  let { page = 1, size = 2000 } = query;

  page = Math.max(parseInt(page, 10) || 1, 1);
  size = Math.min(Math.max(parseInt(size, 10) || 3, 1), 2000);

  const skip = (page - 1) * size;

  return { page, size, skip };
};
