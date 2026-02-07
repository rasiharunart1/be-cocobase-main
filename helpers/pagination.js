const getPagination = (req, res, count, page, limit, search) => {
    const totalPages = Math.ceil(count / limit);
    const nextPage = page < totalPages ? page + 1 : null;
    const prevPage = page > 1 ? page - 1 : null;

    return {
        totalItems: count,
        itemsPerPage: limit,
        currentPage: page,
        totalPages: totalPages,
        nextPage: nextPage,
        prevPage: prevPage,
        search: search || null
    };
};

module.exports = {
    getPagination
};
