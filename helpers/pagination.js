module.exports = {
  getPagination: (req, res, count, page, limit, search, status) => {
    let result = {};
    let link = {};
    let path = `${req.protocol}://${req.get("host")}` + req.baseUrl + req.path;

    if (count - limit * page <= 0) {
      link.next = "";
      if (page - 1 <= 0) {
        link.prev = "";
      } else {
        let prevQuery = `page=${page - 1}&limit=${limit}`;
        if (search) prevQuery += `&search=${search}`;
        if (status) prevQuery += `&status=${status}`;
        link.prev = `${path}?${prevQuery}`;
      }
    } else {
      let nextQuery = `page=${page + 1}&limit=${limit}`;
      if (search) nextQuery += `&search=${search}`;
      if (status) nextQuery += `&status=${status}`;
      link.next = `${path}?${nextQuery}`;
      if (page - 1 <= 0) {
        link.prev = "";
      } else {
        let prevQuery = `page=${page - 1}&limit=${limit}`;
        if (search) prevQuery += `&search=${search}`;
        if (status) prevQuery += `&status=${status}`;
        link.prev = `${path}?${prevQuery}`;
      }
    }

    result.links = link;
    result.total_items = count;

    return result;
  },
};