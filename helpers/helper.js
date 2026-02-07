const formatNomorHP = (nomor) => {
    let formatted = nomor.replace(/\D/g, '');
    if (formatted.startsWith('0')) {
        formatted = '62' + formatted.slice(1);
    }
    return formatted;
};

module.exports = {
    formatNomorHP
};
