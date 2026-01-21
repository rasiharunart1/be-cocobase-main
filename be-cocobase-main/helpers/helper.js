function formatNomorHP(nomerHP) {
  const nomerHPString = nomerHP.toString();
  if (nomerHPString.startsWith("0")) {
    return "62" + nomerHPString.slice(1);
  } else if (!nomerHPString.startsWith("62")) {
    return "62" + nomerHPString;
  } else {
    return nomerHPString;
  }
}

function formatTanggal(tanggal) {
  const date = new Date(tanggal);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const hour = date.getHours().toString().padStart(2, "0");
  const minute = date.getMinutes().toString().padStart(2, "0");

  return `${day}/${month}/${year} ${hour}:${minute}`;
}

module.exports = {
  formatNomorHP,
  formatTanggal,
};
